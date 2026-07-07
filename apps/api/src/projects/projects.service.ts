import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Project, UserRole } from '@erp/shared';
import { FirestoreRepository } from '../common/repositories/firestore.repository';

@Injectable()
export class ProjectsService {
  private permissionCache = new Map<
    string,
    { timestamp: number; hasAccess: boolean }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private projectsRepo: FirestoreRepository<Project>;

  constructor(private firebaseService: FirebaseService) {
    this.projectsRepo = new FirestoreRepository<Project>(
      this.firebaseService.getFirestore(),
      'projects',
    );
  }

  private getCacheKey(projectId: string, userId: string): string {
    return `${projectId}:${userId}`;
  }

  private checkPermissionCache(
    projectId: string,
    userId: string,
  ): boolean | null {
    const key = this.getCacheKey(projectId, userId);
    const cached = this.permissionCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.permissionCache.delete(key);
      return null;
    }
    return cached.hasAccess;
  }

  private setPermissionCache(
    projectId: string,
    userId: string,
    hasAccess: boolean,
  ): void {
    const key = this.getCacheKey(projectId, userId);
    this.permissionCache.set(key, { timestamp: Date.now(), hasAccess });
  }

  async create(projectData: Partial<Project>): Promise<string> {
    return this.projectsRepo.create({
      ...projectData,
      status: 'ACTIVE',
    } as any);
  }

  async findAll(
    userId: string,
    role: string,
    limit: number = 20,
    startAfter?: string,
  ): Promise<{ projects: Project[]; nextCursor?: string }> {
    const db = this.firebaseService.getFirestore();
    let query: any = db.collection('projects').orderBy('createdAt', 'desc');

    if (role === UserRole.COORDINADOR) {
      query = query.where('coordinatorId', '==', userId);
    } else if (role === UserRole.SUPERVISOR) {
      query = query.where('supervisorId', '==', userId);
    }

    query = query.limit(limit + 1);
    if (startAfter) {
      const startDoc = await db.collection('projects').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const projects = docs
      .slice(0, limit)
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Project);

    return { projects, nextCursor: hasMore ? docs[limit - 1].id : undefined };
  }

  async findOne(
    id: string,
    userId: string,
    role: string,
  ): Promise<Project | null> {
    const cachedAccess = this.checkPermissionCache(id, userId);
    if (cachedAccess !== null) {
      if (!cachedAccess)
        throw new ForbiddenException(
          'No tienes permiso para acceder a este proyecto',
        );
      return this.findOneRaw(id);
    }

    const project = await this.findOneRaw(id);
    if (!project) return null;

    let hasAccess = false;
    if (role === UserRole.GERENTE || role === UserRole.PMO) {
      hasAccess = true;
    } else if (
      role === UserRole.COORDINADOR &&
      project.coordinatorId === userId
    ) {
      hasAccess = true;
    } else if (
      role === UserRole.SUPERVISOR &&
      project.supervisorId === userId
    ) {
      hasAccess = true;
    }

    this.setPermissionCache(id, userId, hasAccess);
    if (!hasAccess)
      throw new ForbiddenException(
        'No tienes permiso para acceder a este proyecto',
      );

    return project;
  }

  private async findOneRaw(id: string): Promise<Project | null> {
    return this.projectsRepo.findOneOrNull(id);
  }

  async update(
    id: string,
    updateData: Partial<Project>,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.findOne(id, userId, role);
    await this.projectsRepo.update(id, updateData);
  }

  private getTasksRepo(projectId: string) {
    return new FirestoreRepository<any>(
      this.firebaseService.getFirestore(),
      `projects/${projectId}/tasks`,
    );
  }

  async addTask(
    projectId: string,
    taskData: any,
    userId: string,
    role: string,
  ): Promise<string> {
    await this.findOne(projectId, userId, role);
    return this.getTasksRepo(projectId).create({ ...taskData, projectId });
  }

  async getTasks(
    projectId: string,
    userId: string,
    role: string,
  ): Promise<any[]> {
    await this.findOne(projectId, userId, role);
    return this.getTasksRepo(projectId).findByQuery((c) =>
      c.orderBy('order', 'asc'),
    );
  }

  async updateTask(
    projectId: string,
    taskId: string,
    taskData: any,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.findOne(projectId, userId, role);
    await this.getTasksRepo(projectId).update(taskId, taskData);
  }

  async deleteTask(
    projectId: string,
    taskId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await this.findOne(projectId, userId, role);
    await this.getTasksRepo(projectId).delete(taskId);
  }

  private getMilestonesRepo(projectId: string) {
    return new FirestoreRepository<any>(
      this.firebaseService.getFirestore(),
      `projects/${projectId}/milestones`,
    );
  }

  async createMilestone(
    projectId: string,
    milestoneData: Omit<any, 'id'>,
    userId: string,
    role: string,
  ): Promise<string> {
    await this.findOne(projectId, userId, role);
    return this.getMilestonesRepo(projectId).create(milestoneData);
  }

  async getMilestones(
    projectId: string,
    userId: string,
    role: string,
  ): Promise<any[]> {
    await this.findOne(projectId, userId, role);
    return this.getMilestonesRepo(projectId).findByQuery((c) =>
      c.orderBy('order', 'asc'),
    );
  }

  async updateMilestoneStatus(
    projectId: string,
    milestoneId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    userId: string,
    role: string,
  ): Promise<void> {
    await this.findOne(projectId, userId, role);
    await this.getMilestonesRepo(projectId).update(milestoneId, { status });
  }

  async getProjectHealth(
    projectId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    const project = await this.findOne(projectId, userId, role);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const tasks = await this.getTasksRepo(projectId).findAll();
    const completedTasks = tasks.filter(
      (t: any) => t.status === 'COMPLETED' || t.progress === 100,
    ).length;
    const progressPercentage =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    let budgetHealth = 'GOOD';
    if (project.resources) {
      const budgetUsed =
        (project.resources.budgetSpent / project.resources.budgetAllocated) *
        100;
      if (budgetUsed > 100) budgetHealth = 'CRITICAL';
      else if (budgetUsed > 80) budgetHealth = 'WARNING';
    }

    let scheduleHealth = 'ON_TIME';
    if (project.endDate) {
      const now = new Date();
      const endDate = new Date(project.endDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (now > endDate && progressPercentage < 100) {
        scheduleHealth = 'DELAYED';
      } else if (
        progressPercentage < 50 &&
        daysRemaining < 7 &&
        daysRemaining > 0
      ) {
        scheduleHealth = 'AT_RISK';
      }
    }

    return {
      progressPercentage,
      budgetHealth,
      scheduleHealth,
      tasksCompleted: completedTasks,
      tasksTotal: tasks.length,
    };
  }
}
