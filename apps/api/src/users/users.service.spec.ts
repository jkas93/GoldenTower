import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { UserRole } from '@erp/shared';

describe('UsersService', () => {
  let service: UsersService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  const mockAuth = {
    setCustomUserClaims: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    generatePasswordResetLink: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
            getAuth: jest.fn().mockReturnValue(mockAuth),
          },
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should assign GERENTE role to first user (admin bootstrap)', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [], // No users exist
      });

      const mockDocRef = {
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);
      mockAuth.setCustomUserClaims.mockResolvedValueOnce(undefined);

      const result = await service.register(
        'first-uid',
        'admin@test.com',
        'Admin',
      );

      expect(result.role).toBe(UserRole.GERENTE);
      expect(result.message).toContain('bootstrap');
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'first-uid',
        { role: UserRole.GERENTE },
      );
    });

    it('should assign SUPERVISOR by default to subsequent users', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [{ id: 'existing-user' }],
      });

      const mockDocRef = {
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);
      mockAuth.setCustomUserClaims.mockResolvedValueOnce(undefined);

      const result = await service.register(
        'new-uid',
        'user@test.com',
        'User',
      );

      expect(result.role).toBe(UserRole.SUPERVISOR);
    });

    it('should use requested role for non-first users', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [{ id: 'existing-user' }],
      });

      const mockDocRef = {
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);
      mockAuth.setCustomUserClaims.mockResolvedValueOnce(undefined);

      const result = await service.register(
        'new-uid',
        'rrhh@test.com',
        'RRHH User',
        UserRole.RRHH,
      );

      expect(result.role).toBe(UserRole.RRHH);
    });
  });

  describe('setRole', () => {
    it('should update role in both Auth and Firestore', async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);
      mockAuth.setCustomUserClaims.mockResolvedValueOnce(undefined);

      const result = await service.setRole('uid-1', UserRole.GERENTE);

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'uid-1',
        { role: UserRole.GERENTE },
      );
      expect(result.message).toContain(UserRole.GERENTE);
      expect(result.message).toContain('uid-1');
    });
  });

  describe('acknowledgeLogin', () => {
    it('should activate INVITADO user on first login', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          id: 'uid-1',
          data: () => ({ status: 'INVITADO' }),
        }),
        update: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await service.acknowledgeLogin('uid-1');

      expect(result).toBeDefined();
      expect(result?.status).toBe('ACTIVATED');
    });

    it('should return NO_CHANGE for already active users', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          id: 'uid-1',
          data: () => ({ status: 'ACTIVO' }),
        }),
      });

      const result = await service.acknowledgeLogin('uid-1');
      expect(result?.status).toBe('NO_CHANGE');
    });

    it('should handle missing uid gracefully', async () => {
      const result = await service.acknowledgeLogin('');
      expect(result).toBeUndefined();
    });
  });

  describe('listByRole', () => {
    it('should filter users by role', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { id: '1', data: () => ({ role: UserRole.COORDINADOR }) },
          { id: '2', data: () => ({ role: UserRole.COORDINADOR }) },
        ],
      });

      const result = await service.listByRole(UserRole.COORDINADOR);
      expect(result).toHaveLength(2);
      expect(mockCollection.where).toHaveBeenCalledWith(
        'role',
        '==',
        UserRole.COORDINADOR,
      );
    });
  });
});
