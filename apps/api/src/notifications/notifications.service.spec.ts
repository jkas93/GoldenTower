import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should create a notification with isRead=false', async () => {
      const mockDocRef = {
        id: 'notif-123',
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      const result = await service.sendNotification({
        title: 'Test',
        message: 'Test message',
        type: 'INFO',
        targetRoles: ['GERENTE'],
      });

      expect(result).toBe('notif-123');
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: false,
          title: 'Test',
          type: 'INFO',
        }),
      );
    });

    it('should support all notification types', async () => {
      const types: Array<'INFO' | 'WARNING' | 'ALERT'> = [
        'INFO',
        'WARNING',
        'ALERT',
      ];

      for (const type of types) {
        const mockDocRef = {
          id: `notif-${type}`,
          set: jest.fn().mockResolvedValueOnce(undefined),
        };
        mockCollection.doc.mockReturnValueOnce(mockDocRef);

        await service.sendNotification({
          title: 'Test',
          message: 'Test',
          type,
        });

        expect(mockDocRef.set).toHaveBeenCalledWith(
          expect.objectContaining({ type }),
        );
      }
    });
  });

  describe('getMyNotifications', () => {
    it('should merge role-based and user-specific notifications', async () => {
      // First query: by role
      mockCollection.get.mockResolvedValueOnce({
        forEach: (cb: any) => {
          cb({ id: '1', data: () => ({ createdAt: '2026-01-01' }) });
          cb({ id: '2', data: () => ({ createdAt: '2026-01-02' }) });
        },
      });

      // Second query: by userId
      mockCollection.get.mockResolvedValueOnce({
        forEach: (cb: any) => {
          cb({ id: '2', data: () => ({ createdAt: '2026-01-02' }) }); // duplicate
          cb({ id: '3', data: () => ({ createdAt: '2026-01-03' }) });
        },
      });

      const result = await service.getMyNotifications('user-1', 'GERENTE');

      // Should have 3 unique notifications (2 was duplicated)
      expect(result).toHaveLength(3);
      // Should be sorted by createdAt desc
      expect(result[0].createdAt).toBe('2026-01-03');
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true', async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      await service.markAsRead('notif-1');

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true }),
      );
    });
  });
});
