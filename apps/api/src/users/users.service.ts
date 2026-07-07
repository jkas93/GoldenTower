import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@erp/shared';
import { FirestoreRepository } from '../common/repositories/firestore.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private usersRepo: FirestoreRepository<any>;
  private employeesRepo: FirestoreRepository<any>;

  constructor(
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {
    const firestore = this.firebaseService.getFirestore();
    this.usersRepo = new FirestoreRepository(firestore, 'users');
    this.employeesRepo = new FirestoreRepository(firestore, 'employees');
  }

  async register(
    uid: string,
    email: string,
    name: string,
    requestedRole?: UserRole,
  ) {
    const users = await this.usersRepo.findAllPaginated(1);
    const isFirstUser = users.data.length === 0;

    const finalRole = isFirstUser
      ? UserRole.GERENTE
      : requestedRole || UserRole.SUPERVISOR;

    await this.firebaseService
      .getAuth()
      .setCustomUserClaims(uid, { role: finalRole });

    await this.usersRepo.createWithId(uid, {
      email,
      name,
      role: finalRole,
    });

    return {
      uid,
      role: finalRole,
      message: isFirstUser
        ? 'Admin bootstrap completed'
        : 'User profile initialized',
    };
  }

  async findAll() {
    return this.usersRepo.findAll();
  }

  async listByRole(role: string) {
    return this.usersRepo.findByQuery((c) => c.where('role', '==', role));
  }

  async setRole(uid: string, role: UserRole) {
    await this.firebaseService.getAuth().setCustomUserClaims(uid, { role });
    await this.usersRepo.update(uid, { role });
    return { message: `Role ${role} assigned to user ${uid}` };
  }

  async invite(email: string, name: string, role: UserRole) {
    try {
      const userRecord = await this.firebaseService.getAuth().createUser({
        email,
        displayName: name,
      });

      const uid = userRecord.uid;

      await this.firebaseService.getAuth().setCustomUserClaims(uid, { role });

      await this.usersRepo.createWithId(uid, {
        email,
        name,
        role,
        status: 'INVITADO',
      });

      let resetLink: string;
      try {
        const actionCodeSettings = {
          url: process.env.FRONTEND_URL || 'http://localhost:3000/login',
          handleCodeInApp: false,
        };
        resetLink = await this.firebaseService
          .getAuth()
          .generatePasswordResetLink(email, actionCodeSettings);
      } catch (linkError) {
        this.logger.warn(
          'Failed to generate advanced reset link. Falling back to standard link.',
          linkError.message,
        );
        resetLink = await this.firebaseService
          .getAuth()
          .generatePasswordResetLink(email);
      }

      this.logger.log(
        `Attempting to send welcome email to ${email} with role ${role}...`,
      );

      try {
        await this.mailService.sendWelcomeEmail(email, name, role, resetLink);
        this.logger.log('Email sent successfully');
      } catch (mailError) {
        this.logger.error('Failed to send welcome email:', mailError);
        throw new InternalServerErrorException(
          `Usuario creado, pero falló el envío del correo: ${mailError.message}`,
        );
      }

      return {
        message: 'Usuario invitado exitosamente y correo enviado',
        uid,
        resetLink,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error inviting user: ${error.message}`,
      );
    }
  }

  async deleteInvite(uid: string) {
    try {
      try {
        await this.firebaseService.getAuth().deleteUser(uid);
      } catch (authError: any) {
        if (authError.code !== 'auth/user-not-found') {
          this.logger.warn(
            `Could not delete user ${uid} from Auth:`,
            authError.message,
          );
        }
      }

      try {
        await this.usersRepo.delete(uid);
      } catch (e) {
        this.logger.warn(
          `Could not delete user ${uid} from Firestore users:`,
          e.message,
        );
      }

      try {
        await this.employeesRepo.delete(uid);
      } catch (e) {
        this.logger.warn(
          `Could not delete user ${uid} from Firestore employees:`,
          e.message,
        );
      }

      return { message: 'Invitación y registros eliminados exitosamente' };
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error deleting invitation: ${error.message}`,
      );
    }
  }

  async acknowledgeLogin(uid: string) {
    if (!uid) return;

    const user = await this.usersRepo.findOneOrNull(uid);

    if (user && user.status === 'INVITADO') {
      this.logger.log(`Auto-activating user ${uid} from INVITADO to ACTIVO`);
      await this.usersRepo.update(uid, {
        status: 'ACTIVO',
        activatedAt: new Date().toISOString(),
        firstLoginAt: new Date().toISOString(),
      });
      return {
        status: 'ACTIVATED',
        message: 'User status updated to ACTIVO',
      };
    }

    return { status: 'NO_CHANGE', message: 'User already active or not found' };
  }
}
