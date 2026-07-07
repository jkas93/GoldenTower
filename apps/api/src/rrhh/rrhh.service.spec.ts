import { Test, TestingModule } from '@nestjs/testing';
import { RRHHService } from './rrhh.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { ConflictException } from '@nestjs/common';
import { FinanceService } from '../finance/finance.service';

describe('RRHHService', () => {
  let service: RRHHService;
  let firebaseService: jest.Mocked<FirebaseService>;
  let mailService: jest.Mocked<MailService>;

  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuth = {
    createUser: jest.fn(),
    generatePasswordResetLink: jest.fn(),
    setCustomUserClaims: jest.fn(),
    getUserByEmail: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RRHHService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
            getAuth: jest.fn().mockReturnValue(mockAuth),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
        {
          provide: FinanceService,
          useValue: {
            createPurchase: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RRHHService>(RRHHService);
    firebaseService = module.get(FirebaseService);
    mailService = module.get(MailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUniqueFields', () => {
    it('should throw ConflictException if DNI exists', async () => {
      mockFirestore.get.mockResolvedValueOnce({
        docs: [{ id: 'some-id', data: () => ({ name: 'John Doe' }) }],
      });

      await expect(
        service['validateUniqueFields']('12345678', undefined),
      ).rejects.toThrow(ConflictException);
    });

    it('should pass if DNI is unique', async () => {
      mockFirestore.get.mockResolvedValueOnce({
        docs: [],
      });

      await expect(
        service['validateUniqueFields']('12345678', undefined),
      ).resolves.not.toThrow();
    });
  });

  describe('createEmployee', () => {
    it('should create an employee and send welcome email', async () => {
      // Mock validateUniqueFields as resolving without errors
      mockFirestore.get.mockResolvedValueOnce({ docs: [] }); // DNI check
      mockFirestore.get.mockResolvedValueOnce({ docs: [] }); // Email check

      // Mock docSnap.exists as false
      mockFirestore.get.mockResolvedValueOnce({ exists: false }); // docSnap check

      mockAuth.createUser.mockResolvedValueOnce({ uid: 'new-uid' });
      mockAuth.generatePasswordResetLink.mockResolvedValueOnce(
        'http://reset-link',
      );

      const employeeData = {
        name: 'Jane',
        email: 'jane@example.com',
        dni: '87654321',
        role: 'RRHH',
      };

      const result = await service.createEmployee(employeeData);

      expect(result).toBe('new-uid');
      expect(mockAuth.createUser).toHaveBeenCalled();
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane',
          id: 'new-uid',
          status: 'INVITADO',
          roles: ['RRHH'],
        }),
        { merge: true },
      );
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'Jane',
        'RRHH',
        'http://reset-link',
      );
    });

    it('should handle auth error gracefully and fetch existing user', async () => {
      mockFirestore.get.mockResolvedValueOnce({ docs: [] }); // DNI check
      mockFirestore.get.mockResolvedValueOnce({ docs: [] }); // Email check
      mockFirestore.get.mockResolvedValueOnce({ exists: false }); // docSnap check

      mockAuth.createUser.mockRejectedValueOnce({
        code: 'auth/email-already-exists',
      });
      mockAuth.getUserByEmail.mockResolvedValueOnce({ uid: 'existing-uid' });

      const employeeData = {
        name: 'Jane',
        email: 'jane@example.com',
        dni: '87654321',
        role: 'RRHH',
      };

      const result = await service.createEmployee(employeeData);

      expect(result).toBe('existing-uid');
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith('jane@example.com');
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-uid',
        }),
        { merge: true },
      );
      // Welcome email shouldn't be sent for existing auth user
      expect(mailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });
});
