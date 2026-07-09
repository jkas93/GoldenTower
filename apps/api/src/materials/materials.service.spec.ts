import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('MaterialsService', () => {
  let service: MaterialsService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
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
        MaterialsService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a material and return its id', async () => {
      const mockDocRef = {
        id: 'material-123',
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      const materialData = {
        name: 'Cemento',
        unit: 'kg',
        stock: 100,
      };

      const result = await service.create(materialData as any);
      expect(result).toBe('material-123');
    });
  });

  describe('findAll', () => {
    it('should return all materials ordered by name', async () => {
      const mockMaterials = [
        { id: '1', name: 'Cemento', stock: 100 },
        { id: '2', name: 'Arena', stock: 50 },
      ];

      mockCollection.get.mockResolvedValueOnce({
        docs: mockMaterials.map((m) => ({
          id: m.id,
          data: () => m,
        })),
      });

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockCollection.orderBy).toHaveBeenCalledWith('name');
    });
  });

  describe('updateStock', () => {
    it('should throw error if material not found', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({ exists: false }),
      });

      await expect(
        service.updateStock('non-existent', 10),
      ).rejects.toThrow('Material no encontrado');
    });

    it('should throw error if resulting stock is negative', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          id: 'mat-1',
          data: () => ({ stock: 5 }),
        }),
      });

      await expect(
        service.updateStock('mat-1', -10),
      ).rejects.toThrow('Stock insuficiente');
    });

    it('should update stock correctly when positive', async () => {
      mockCollection.doc.mockReturnValueOnce({
        get: jest.fn().mockResolvedValueOnce({
          exists: true,
          id: 'mat-1',
          data: () => ({ stock: 10 }),
        }),
        update: jest.fn().mockResolvedValueOnce(undefined),
      });

      await expect(
        service.updateStock('mat-1', 5),
      ).resolves.not.toThrow();
    });
  });
});
