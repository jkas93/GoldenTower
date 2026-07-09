import { Test, TestingModule } from '@nestjs/testing';
import { ProgressLogsService } from './progress-logs.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('ProgressLogsService', () => {
  let service: ProgressLogsService;

  const mockLogRef = {
    id: 'log-123',
  };
  
  const mockTaskRef = {};

  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  const mockSubCollection = {
    doc: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  const mockProjectDoc = {
    collection: jest.fn().mockReturnValue(mockSubCollection),
  };

  const mockCollection = {
    doc: jest.fn().mockReturnValue(mockProjectDoc),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
    batch: jest.fn().mockReturnValue(mockBatch),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressLogsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<ProgressLogsService>(ProgressLogsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a log and update task progress in batch', async () => {
      mockSubCollection.doc
        .mockReturnValueOnce(mockLogRef) // for log creation
        .mockReturnValueOnce(mockTaskRef); // for task update

      const logData = {
        taskId: 'task-1',
        date: '2026-01-01',
        progressPercentage: 50,
        notes: 'Test',
      };

      const result = await service.create('project-1', logData as any, 'user-1');

      expect(result).toBe('log-123');
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledWith(
        mockTaskRef,
        { progress: 50 },
      );
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('findByProject', () => {
    it('should return progress logs for a project', async () => {
      mockSubCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: '1', progressPercentage: 25 }) },
          { data: () => ({ id: '2', progressPercentage: 50 }) },
        ],
      });

      const result = await service.findByProject('project-1');
      expect(result).toHaveLength(2);
      expect(mockSubCollection.orderBy).toHaveBeenCalledWith('date', 'asc');
    });
  });

  describe('findByTask', () => {
    it('should filter progress logs by taskId', async () => {
      mockSubCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: '1', taskId: 'task-1', progressPercentage: 30 }) },
        ],
      });

      const result = await service.findByTask('project-1', 'task-1');
      expect(result).toHaveLength(1);
      expect(mockSubCollection.where).toHaveBeenCalledWith('taskId', '==', 'task-1');
    });
  });
});
