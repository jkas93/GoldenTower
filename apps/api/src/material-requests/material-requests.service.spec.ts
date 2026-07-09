import { Test, TestingModule } from '@nestjs/testing';
import { MaterialRequestsService } from './material-requests.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FinanceService } from '../finance/finance.service';

describe('MaterialRequestsService', () => {
  let service: MaterialRequestsService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  const mockBatch = {
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
    batch: jest.fn().mockReturnValue(mockBatch),
  };

  const mockFinanceService = {
    createPurchase: jest.fn().mockResolvedValue('purchase-id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialRequestsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    }).compile();

    service = module.get<MaterialRequestsService>(MaterialRequestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all material requests sorted by date desc', async () => {
      const mockRequests = [
        { id: '1', status: 'PENDIENTE', createdAt: '2026-01-01' },
        { id: '2', status: 'APROBADO', createdAt: '2026-01-03' },
        { id: '3', status: 'PENDIENTE', createdAt: '2026-01-02' },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockRequests.map((r) => ({
          id: r.id,
          data: () => r,
        })),
      });

      const result = await service.findAll();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('2'); // Most recent
    });

    it('should filter by status when provided', async () => {
      const mockRequests = [
        { id: '1', status: 'PENDIENTE', createdAt: '2026-01-01' },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockRequests.map((r) => ({
          id: r.id,
          data: () => r,
        })),
      });

      await service.findAll('PENDIENTE');
      expect(mockCollection.where).toHaveBeenCalledWith('status', '==', 'PENDIENTE');
    });
  });

  describe('findByProject', () => {
    it('should return requests filtered by projectId', async () => {
      const mockRequests = [
        { id: '1', projectId: 'proj-1', createdAt: '2026-01-01' },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockRequests.map((r) => ({
          id: r.id,
          data: () => r,
        })),
      });

      const result = await service.findByProject('proj-1');
      expect(result).toHaveLength(1);
      expect(mockCollection.where).toHaveBeenCalledWith('projectId', '==', 'proj-1');
    });
  });

  describe('updateStatus', () => {
    it('should throw error if request not found', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({ exists: false }),
      });

      await expect(
        service.updateStatus('non-existent-id', 'APROBADO'),
      ).rejects.toThrow('Solicitud no encontrada');
    });

    it('should create automatic purchase when APROBADO', async () => {
      const mockRequest = {
        id: 'req-1',
        projectId: 'proj-1',
        status: 'PENDIENTE',
        items: [
          { materialId: 'mat-1', materialName: 'Cemento', quantity: 10 },
        ],
      };

      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          id: 'req-1',
          data: () => mockRequest,
        }),
        update: jest.fn().mockResolvedValueOnce(undefined),
      });

      await service.updateStatus('req-1', 'APROBADO');

      expect(mockFinanceService.createPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          status: 'PENDIENTE',
          currency: 'PEN',
        }),
      );
    });
  });
});
