import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Material, CreateMaterialDto } from '@erp/shared';
import { FirestoreRepository } from '../common/repositories/firestore.repository';

@Injectable()
export class MaterialsService {
  private repository: FirestoreRepository<Material>;

  constructor(private firebaseService: FirebaseService) {
    this.repository = new FirestoreRepository<Material>(
      this.firebaseService.getFirestore(),
      'materials',
    );
  }

  async create(data: CreateMaterialDto): Promise<string> {
    return this.repository.create(data);
  }

  async findAll(): Promise<Material[]> {
    return this.repository.findByQuery((collection) =>
      collection.orderBy('name'),
    );
  }

  async findOne(id: string): Promise<Material | null> {
    return this.repository.findOneOrNull(id);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    const material = await this.findOne(id);
    if (!material) throw new Error('Material no encontrado');

    const newStock = (material.stock || 0) + quantity;
    if (newStock < 0) throw new Error('Stock insuficiente');

    await this.repository.update(id, { stock: newStock });
  }
}
