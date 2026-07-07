import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateMaterialRequestDto, MaterialRequest } from '@erp/shared';
import { FirestoreRepository } from '../common/repositories/firestore.repository';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class MaterialRequestsService {
  private repository: FirestoreRepository<MaterialRequest>;

  constructor(
    private firebaseService: FirebaseService,
    private financeService: FinanceService,
  ) {
    this.repository = new FirestoreRepository<MaterialRequest>(
      this.firebaseService.getFirestore(),
      'material_requests',
    );
  }

  async create(data: CreateMaterialRequestDto): Promise<string> {
    return this.repository.create(data as unknown as Partial<MaterialRequest>);
  }

  async findByProject(projectId: string): Promise<MaterialRequest[]> {
    const requests = await this.repository.findByQuery((collection) =>
      collection.where('projectId', '==', projectId),
    );

    // Sort in memory to avoid composite index requirement issues during dev
    return requests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async updateStatus(
    id: string,
    status: MaterialRequest['status'],
    rejectionReason?: string,
  ): Promise<void> {
    const request = await this.repository.findOneOrNull(id);
    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    const updateData: any = { status };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    await this.repository.update(id, updateData);

    // Auto-create purchase if approved and wasn't already approved
    if (status === 'APROBADO' && request.status !== 'APROBADO') {
      const itemsDesc = request.items
        ?.map((i) => `${i.quantity}x ${i.materialName || i.materialId}`)
        .join(', ');

      await this.financeService.createPurchase({
        projectId: request.projectId,
        description: `Compra autom\u00E1tica para Solicitud: ${itemsDesc}`,
        provider: 'POR DEFINIR',
        amount: 1, // Minimum allowed by positive validation
        currency: 'PEN',
        status: 'PENDIENTE',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }
}
