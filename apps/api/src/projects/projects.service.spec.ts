import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProjectDto, ProjectTask, TaskType } from '@erp/shared';

describe('ProjectsService', () => {
    let service: ProjectsService;
    let firebaseService: jest.Mocked<FirebaseService>;

    const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
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
        firebaseService = module.get(FirebaseService);

        jest.clearAllMocks();
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
                status: 'ACTIVE'
            };

            const result = await service.create(createProjectDto);
            
            expect(result).toBeDefined();
            expect(mockFirestore.collection).toHaveBeenCalledWith('projects');
            expect(mockFirestore.set).toHaveBeenCalled();
        });
    });

    describe('getProjectHealth', () => {
        it('should calculate project health metrics accurately', async () => {
            // Mock getProject
            mockFirestore.get.mockResolvedValueOnce({
                exists: true,
                id: 'proj-1',
                data: () => ({ status: 'ACTIVE' })
            });

            // Mock getTasks
            mockFirestore.get.mockResolvedValueOnce({
                docs: [
                    { id: 't1', data: () => ({ type: TaskType.ACTIVITY, status: 'COMPLETED' }) },
                    { id: 't2', data: () => ({ type: TaskType.ACTIVITY, status: 'IN_PROGRESS' }) },
                    { id: 't3', data: () => ({ type: TaskType.AREA, status: 'PENDING' }) }, // Should be ignored (not ACTIVITY)
                ]
            });

            // Mock getMilestones
            mockFirestore.get.mockResolvedValueOnce({
                docs: [
                    { id: 'm1', data: () => ({ status: 'COMPLETED' }) }
                ]
            });

            // Mock progress logs (no logs)
            mockFirestore.get.mockResolvedValueOnce({ docs: [] });

            const health = await service.getProjectHealth('proj-1', 'admin-uid', 'GERENTE');

            expect(health).toBeDefined();
            expect(health.tasksCompleted).toBe(1);
            expect(health.tasksTotal).toBe(2);
            expect(health.scheduleHealth).toBe('ON_TIME');
        });
    });
});
