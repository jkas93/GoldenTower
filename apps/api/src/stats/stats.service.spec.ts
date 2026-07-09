import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('StatsService', () => {
  let service: StatsService;

  const mockCollection = {
    get: jest.fn(),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should aggregate stats from projects, employees, and purchases', async () => {
      // Projects
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ status: 'ACTIVE', budget: 100000 }) },
          { data: () => ({ status: 'ACTIVE', budget: 50000 }) },
          { data: () => ({ status: 'PAUSED', budget: 30000 }) },
        ],
      });

      // Employees
      mockCollection.get.mockResolvedValueOnce({
        size: 15,
        docs: [],
      });

      // Purchases
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ status: 'APROBADO', amount: 5000 }) },
          { data: () => ({ status: 'PAGADO', amount: 3000 }) },
          { data: () => ({ status: 'PENDIENTE', amount: 2000 }) },
          { data: () => ({ status: 'RECIBIDO', amount: 1000 }) },
        ],
      });

      const result = await service.getDashboardStats();

      expect(result.activeProjects).toBe(2);
      expect(result.totalBudget).toBe(180000);
      expect(result.collaborators).toBe(15);
      // Only APROBADO + PAGADO + RECIBIDO are counted (not PENDIENTE)
      expect(result.actualCost).toBe(9000);
      expect(result.efficiency).toBe(92);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle empty collections', async () => {
      // Empty projects
      mockCollection.get.mockResolvedValueOnce({ docs: [] });
      // Empty employees
      mockCollection.get.mockResolvedValueOnce({ size: 0, docs: [] });
      // Empty purchases
      mockCollection.get.mockResolvedValueOnce({ docs: [] });

      const result = await service.getDashboardStats();

      expect(result.activeProjects).toBe(0);
      expect(result.totalBudget).toBe(0);
      expect(result.collaborators).toBe(0);
      expect(result.actualCost).toBe(0);
    });

    it('should handle projects with invalid budget values', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { data: () => ({ status: 'ACTIVE', budget: null }) },
          { data: () => ({ status: 'ACTIVE', budget: 'invalid' }) },
          { data: () => ({ status: 'ACTIVE', budget: 100 }) },
        ],
      });
      mockCollection.get.mockResolvedValueOnce({ size: 0, docs: [] });
      mockCollection.get.mockResolvedValueOnce({ docs: [] });

      const result = await service.getDashboardStats();
      // Only valid budget should be counted
      expect(result.totalBudget).toBe(100);
    });
  });
});
