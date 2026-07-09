import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('FinanceService', () => {
  let service: FinanceService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
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
        FinanceService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPurchase', () => {
    it('should create a purchase and return the id', async () => {
      mockCollection.doc.mockReturnValueOnce({
        id: 'purchase-123',
        set: jest.fn().mockResolvedValueOnce(undefined),
      });

      const purchaseData = {
        projectId: 'project-1',
        amount: 100,
        currency: 'PEN',
        provider: 'Test Provider',
        description: 'Test Purchase',
      };

      const result = await service.createPurchase(purchaseData);
      expect(result).toBe('purchase-123');
    });
  });

  describe('findAllPurchases', () => {
    it('should return all purchases ordered by createdAt', async () => {
      const mockPurchases = [
        { id: '1', amount: 100, createdAt: '2026-01-01' },
        { id: '2', amount: 200, createdAt: '2026-01-02' },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockPurchases.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      });

      const result = await service.findAllPurchases();
      expect(result).toHaveLength(2);
      expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array when no purchases exist', async () => {
      mockCollection.get.mockResolvedValueOnce({ docs: [] });
      const result = await service.findAllPurchases();
      expect(result).toEqual([]);
    });
  });

  describe('findPurchasesByProject', () => {
    it('should return purchases sorted by createdAt descending', async () => {
      const mockPurchases = [
        { id: '1', createdAt: '2026-01-01' },
        { id: '2', createdAt: '2026-01-03' },
        { id: '3', createdAt: '2026-01-02' },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockPurchases.map((p) => ({
          id: p.id,
          data: () => p,
        })),
      });

      const result = await service.findPurchasesByProject('project-1');
      expect(result[0].id).toBe('2'); // Most recent
      expect(result[1].id).toBe('3');
      expect(result[2].id).toBe('1');
    });
  });

  describe('updatePurchase', () => {
    it('should update a purchase', async () => {
      mockCollection.doc.mockReturnValueOnce({
        update: jest.fn().mockResolvedValueOnce(undefined),
      });

      await expect(
        service.updatePurchase('purchase-1', { amount: 150 }),
      ).resolves.not.toThrow();
    });
  });
});
