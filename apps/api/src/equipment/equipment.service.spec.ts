import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
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
        EquipmentService,
        {
          provide: FirebaseService,
          useValue: {
            getFirestore: jest.fn().mockReturnValue(mockFirestore),
          },
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all equipment ordered by createdAt desc', async () => {
      mockCollection.get.mockResolvedValueOnce({
        docs: [
          { id: '1', data: () => ({ name: 'Excavadora', status: 'DISPONIBLE' }) },
          { id: '2', data: () => ({ name: 'Grúa', status: 'EN_USO' }) },
        ],
      });

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });
  });

  describe('addMaintenanceLog', () => {
    it('should create log and update equipment status', async () => {
      // First call: create the maintenance log
      const mockLogDocRef = {
        id: 'log-123',
        set: jest.fn().mockResolvedValueOnce(undefined),
      };
      
      // Second call: update the equipment
      const mockEquipDocRef = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };

      mockCollection.doc
        .mockReturnValueOnce(mockLogDocRef)
        .mockReturnValueOnce(mockEquipDocRef);

      const logData = {
        equipmentId: 'equip-1',
        date: '2026-01-01',
        description: 'Cambio de aceite',
        cost: 100,
        nextMaintenanceDate: '2026-04-01',
      };

      const result = await service.addMaintenanceLog(logData as any);
      expect(result).toBe('log-123');
    });
  });

  describe('assignToProject', () => {
    it('should set status to EN_USO when assigning to a project', async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      await service.assignToProject('equip-1', 'project-1');

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedProjectId: 'project-1',
          status: 'EN_USO',
        }),
      );
    });

    it('should set status to DISPONIBLE when unassigning', async () => {
      const mockDocRef = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockCollection.doc.mockReturnValueOnce(mockDocRef);

      await service.assignToProject('equip-1', null);

      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DISPONIBLE',
        }),
      );
    });
  });
});
