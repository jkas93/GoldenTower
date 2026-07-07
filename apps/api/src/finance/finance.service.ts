import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FirestoreRepository } from '../common/repositories/firestore.repository';
import * as admin from 'firebase-admin';

@Injectable()
export class FinanceService {
  private purchasesRepo: FirestoreRepository<any>;

  constructor(private firebaseService: FirebaseService) {
    this.purchasesRepo = new FirestoreRepository<any>(
      this.firebaseService.getFirestore(),
      'purchases',
    );
  }

  async createPurchase(data: any): Promise<string> {
    return this.purchasesRepo.create(data);
  }

  async findAllPurchases(): Promise<any[]> {
    return this.purchasesRepo.findByQuery((c) =>
      c.orderBy('createdAt', 'desc'),
    );
  }

  async updatePurchase(id: string, data: Partial<any>): Promise<void> {
    await this.purchasesRepo.update(id, data);
  }

  async findPurchasesByProject(projectId: string): Promise<any[]> {
    const purchases = await this.purchasesRepo.findByQuery((c) =>
      c.where('projectId', '==', projectId),
    );
    return purchases.sort(
      (a, b) =>
        new Date(b.createdAt as string).getTime() -
        new Date(a.createdAt as string).getTime(),
    );
  }

  async updatePurchaseStatus(id: string, status: string): Promise<void> {
    await this.purchasesRepo.update(id, { status });

    const purchase = await this.purchasesRepo.findOneOrNull(id);
    if (purchase && purchase.projectId) {
      await this.updateProjectBudgetSpent(purchase.projectId);
    }
    
    // Si la compra es de un material y se marca como RECIBIDO, incrementamos el stock
    if (purchase && purchase.materialId && purchase.quantity && status === 'RECIBIDO') {
      try {
        const materialRef = this.firebaseService
          .getFirestore()
          .collection('materials')
          .doc(purchase.materialId);
          
        await materialRef.update({
          stock: admin.firestore.FieldValue.increment(purchase.quantity)
        });
        
        console.log(`Stock incremented by ${purchase.quantity} for material ${purchase.materialId}`);
      } catch (error) {
        console.error('Error incrementing material stock:', error);
      }
    }
  }

  private async updateProjectBudgetSpent(projectId: string): Promise<void> {
    const summary = await this.getProjectFinancialSummary(projectId);

    // update project
    const projectRef = this.firebaseService
      .getFirestore()
      .collection('projects')
      .doc(projectId);
    await projectRef.set(
      {
        resources: {
          budgetSpent: summary.totalActualCost,
        },
      },
      { merge: true },
    );
  }

  async getProjectFinancialSummary(projectId: string): Promise<any> {
    const purchases = await this.findPurchasesByProject(projectId);
    const totalActualCost = purchases
      .filter(
        (p) =>
          p.status === 'APROBADO' ||
          p.status === 'PAGADO' ||
          p.status === 'RECIBIDO',
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalActualCost,
      purchaseCount: purchases.length,
      currency: purchases[0]?.currency || 'PEN',
    };
  }
}
