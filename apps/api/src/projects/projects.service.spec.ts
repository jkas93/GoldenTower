import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProjectDto, TaskType } from '@erp/shared';

describe('ProjectsService', () => {
  let service: ProjectsService;

  // Nested collection mock for tasks subcollection
  const mockTasksCollection = {
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };

  const mockProjectDoc = {
    id: 'generated-id',
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn().mockReturnValue(mockTasksCollection),
  };

  const mockFirestoreCollection = {
    doc: jest.fn().mockReturnValue(mockProjectDoc),
    get: jest.fn(),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockFirestoreCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);

    jest.clearAllMocks();
    // Restore default returns after clearAllMocks
    mockFirestore.collection.mockReturnValue(mockFirestoreCollection);
    mockProjectDoc.collection.mockReturnValue(mockTasksCollection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Tower',
        description: 'A massive tower project',
        coordinatorId: 'coord-1',
        supervisorId: 'sup-1',
        status: 'ACTIVE',
      };

      const result = await service.create(createProjectDto);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockProjectDoc.set).toHaveBeenCalled();
    });
  });

  describe('getProjectHealth', () => {
    it('should calculate project health metrics accurately', async () => {
      // Spy on findOne to bypass Firestore permission chain
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'proj-1',
        status: 'ACTIVE',
      } as never);

      // Mock tasks subcollection: 1 COMPLETED, 1 IN_PROGRESS, 1 AREA
      // Service counts ALL tasks regardless of type → total = 3
      mockFirestoreCollection.get.mockResolvedValueOnce({
        docs: [
          {
            id: 't1',
            data: () => ({ type: TaskType.ACTIVITY, status: 'COMPLETED' }),
          },
          {
            id: 't2',
            data: () => ({ type: TaskType.ACTIVITY, status: 'IN_PROGRESS' }),
          },
          {
            id: 't3',
            data: () => ({ type: TaskType.AREA, status: 'PENDING' }),
          },
        ],
      });

      const health = await service.getProjectHealth(
        'proj-1',
        'admin-uid',
        'GERENTE',
      );

      expect(health).toBeDefined();
      expect(health.tasksCompleted).toBe(1);
      expect(health.tasksTotal).toBe(3); // service counts all tasks, not just ACTIVITY
      expect(health.scheduleHealth).toBe('ON_TIME');
    });
  });
});
