import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an activity with generated id', async () => {
      const mockDocRef = {
        id: 'activity-123',
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      const result = await service.create({
        name: 'Excavación',
        category: 'CONSTRUCCION',
      });

      expect(result).toBe('activity-123');
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'activity-123',
          name: 'Excavación',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return activities ordered by name', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: '1', name: 'Activity A' }) },
          { data: () => ({ id: '2', name: 'Activity B' }) },
        ],
      });

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockCollection.orderBy).toHaveBeenCalledWith('name', 'asc');
    });
  });

  describe('findOne', () => {
    it('should return null if not found', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({ exists: false }),
      });

      const result = await service.findOne('non-existent');
      expect(result).toBeNull();
    });

    it('should return activity data if found', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          data: () => ({ id: 'act-1', name: 'Test Activity' }),
        }),
      });

      const result = await service.findOne('act-1');
      expect(result).toEqual({ id: 'act-1', name: 'Test Activity' });
    });
  });

  describe('delete', () => {
    it('should delete an activity', async () => {
      const mockDocRef = {
        delete: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      await expect(service.delete('act-1')).resolves.not.toThrow();
      expect(mockDocRef.delete).toHaveBeenCalled();
    });
  });
});
