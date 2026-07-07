import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FirestoreRepository } from '../common/repositories/firestore.repository';

@Injectable()
export class NotificationsService {
  private notificationsRepo: FirestoreRepository<any>;

  constructor(private firebaseService: FirebaseService) {
    this.notificationsRepo = new FirestoreRepository<any>(
      this.firebaseService.getFirestore(),
      'notifications',
    );
  }

  async sendNotification(data: {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT';
    targetRoles?: string[];
    targetUserId?: string;
    link?: string;
  }): Promise<string> {
    const notification = {
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const id = await this.notificationsRepo.create(notification);
    
    // Aquí podríamos integrar Firebase Cloud Messaging (FCM) 
    // para notificaciones Push reales si tuviéramos tokens guardados.
    
    return id;
  }

  async getMyNotifications(userId: string, role: string): Promise<any[]> {
    // Ideally we would query by targetUserId OR targetRoles contains role
    // For simplicity with Firestore, we'll fetch both and merge or just fetch all and filter if it's small,
    // or use two queries.
    
    const db = this.firebaseService.getFirestore();
    const roleDocs = await db.collection('notifications')
        .where('targetRoles', 'array-contains', role)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
        
    const userDocs = await db.collection('notifications')
        .where('targetUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    const notifications = new Map();
    roleDocs.forEach(doc => notifications.set(doc.id, { id: doc.id, ...doc.data() }));
    userDocs.forEach(doc => notifications.set(doc.id, { id: doc.id, ...doc.data() }));

    return Array.from(notifications.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepo.update(id, { isRead: true });
  }
}
