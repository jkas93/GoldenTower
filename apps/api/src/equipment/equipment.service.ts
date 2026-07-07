import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FirestoreRepository } from '../common/repositories/firestore.repository';
import { Equipment, MaintenanceLog, CreateEquipmentDto, CreateMaintenanceLogDto } from '@erp/shared';

@Injectable()
export class EquipmentService {
  private equipmentRepo: FirestoreRepository<Equipment>;
  private maintenanceRepo: FirestoreRepository<MaintenanceLog>;

  constructor(private firebaseService: FirebaseService) {
    const db = this.firebaseService.getFirestore();
    this.equipmentRepo = new FirestoreRepository<Equipment>(db, 'equipment');
    this.maintenanceRepo = new FirestoreRepository<MaintenanceLog>(db, 'maintenance_logs');
  }

  async create(data: CreateEquipmentDto): Promise<string> {
    return this.equipmentRepo.create(data as unknown as Partial<Equipment>);
  }

  async findAll(): Promise<Equipment[]> {
    return this.equipmentRepo.findByQuery((c) => c.orderBy('createdAt', 'desc'));
  }

  async findOne(id: string): Promise<Equipment | null> {
    return this.equipmentRepo.findOneOrNull(id);
  }

  async update(id: string, data: Partial<CreateEquipmentDto>): Promise<void> {
    await this.equipmentRepo.update(id, data as any);
  }

  async delete(id: string): Promise<void> {
    await this.equipmentRepo.delete(id);
  }

  async addMaintenanceLog(data: CreateMaintenanceLogDto): Promise<string> {
    const logId = await this.maintenanceRepo.create(data as unknown as Partial<MaintenanceLog>);
    
    // Update equipment's lastMaintenanceDate and nextMaintenanceDate
    const updateData: any = {
      lastMaintenanceDate: data.date,
      status: 'DISPONIBLE',
    };
    if (data.nextMaintenanceDate) {
      updateData.nextMaintenanceDate = data.nextMaintenanceDate;
    }
    await this.equipmentRepo.update(data.equipmentId!, updateData);
    
    return logId;
  }

  async getMaintenanceLogs(equipmentId: string): Promise<MaintenanceLog[]> {
    const logs = await this.maintenanceRepo.findByQuery((c) =>
      c.where('equipmentId', '==', equipmentId)
    );
    return logs.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async assignToProject(equipmentId: string, projectId: string | null): Promise<void> {
    await this.equipmentRepo.update(equipmentId, {
      assignedProjectId: projectId || undefined,
      status: projectId ? 'EN_USO' : 'DISPONIBLE',
    } as any);
  }
}
