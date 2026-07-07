import {
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface RepositoryOptions {
  logActions?: boolean;
}

export class FirestoreRepository<T> {
  protected readonly logger: Logger;
  protected readonly collection: admin.firestore.CollectionReference;

  constructor(
    protected readonly firestore: admin.firestore.Firestore,
    protected readonly collectionName: string,
    protected readonly options: RepositoryOptions = { logActions: true },
  ) {
    this.logger = new Logger(`FirestoreRepository<${collectionName}>`);
    this.collection = this.firestore.collection(collectionName);
  }

  /**
   * Obtiene todos los documentos de la colección
   */
  async findAll(): Promise<(T & { id: string })[]> {
    try {
      const snapshot = await this.collection.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as T),
      }));
    } catch (error) {
      this.logger.error(
        `Error fetching all from ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error fetching data from ${this.collectionName}`,
      );
    }
  }

  /**
   * Obtiene un documento por ID
   */
  async findOne(id: string): Promise<T & { id: string }> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new NotFoundException(
          `Document with id ${id} not found in ${this.collectionName}`,
        );
      }
      return {
        id: doc.id,
        ...(doc.data() as T),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error fetching ${id} from ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error fetching document from ${this.collectionName}`,
      );
    }
  }

  /**
   * Obtiene un documento por ID retornando null si no existe
   */
  async findOneOrNull(id: string): Promise<(T & { id: string }) | null> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return null;
      return {
        id: doc.id,
        ...(doc.data() as T),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching ${id} from ${this.collectionName}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Crea un documento (id autogenerado)
   */
  async create(data: Partial<T>): Promise<string> {
    try {
      const docRef = this.collection.doc();
      const payload = {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await docRef.set(payload);
      if (this.options.logActions) {
        this.logger.log(
          `Created document ${docRef.id} in ${this.collectionName}`,
        );
      }
      return docRef.id;
    } catch (error) {
      this.logger.error(
        `Error creating in ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error creating document in ${this.collectionName}`,
      );
    }
  }

  /**
   * Crea o sobreescribe un documento con un ID específico
   */
  async createWithId(id: string, data: Partial<T>): Promise<void> {
    try {
      const payload = {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await this.collection.doc(id).set(payload, { merge: true });
      if (this.options.logActions) {
        this.logger.log(
          `Created/Updated document ${id} in ${this.collectionName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error creating document ${id} in ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error creating document in ${this.collectionName}`,
      );
    }
  }

  /**
   * Actualiza un documento existente
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const payload = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await this.collection.doc(id).update(payload);
      if (this.options.logActions) {
        this.logger.log(`Updated document ${id} in ${this.collectionName}`);
      }
    } catch (error) {
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        throw new NotFoundException(
          `Document with id ${id} not found for update`,
        );
      }
      this.logger.error(
        `Error updating document ${id} in ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error updating document in ${this.collectionName}`,
      );
    }
  }

  /**
   * Elimina un documento
   */
  async delete(id: string): Promise<void> {
    try {
      await this.collection.doc(id).delete();
      if (this.options.logActions) {
        this.logger.log(`Deleted document ${id} from ${this.collectionName}`);
      }
    } catch (error) {
      this.logger.error(
        `Error deleting document ${id} from ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error deleting document from ${this.collectionName}`,
      );
    }
  }

  /**
   * Ejecuta una query con validaciones básicas
   * Retorna los documentos mapeados
   */
  async findByQuery(
    queryBuilder: (
      collection: admin.firestore.CollectionReference,
    ) => admin.firestore.Query,
  ): Promise<(T & { id: string })[]> {
    try {
      const query = queryBuilder(this.collection);
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as T),
      }));
    } catch (error) {
      this.logger.error(
        `Error executing query in ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error querying ${this.collectionName}`,
      );
    }
  }

  /**
   * Obtiene lista paginada de documentos
   * @param limit - Número máximo de documentos a retornar
   * @param orderByField - Campo por el cual ordenar
   * @param orderDirection - Dirección ('asc' | 'desc')
   * @param startAfterId - ID del documento cursor
   */
  async findAllPaginated(
    limit: number = 50,
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc',
    startAfterId?: string,
  ): Promise<{ data: (T & { id: string })[]; nextCursor?: string }> {
    try {
      let query = this.collection
        .orderBy(orderByField, orderDirection)
        .limit(limit + 1);

      if (startAfterId) {
        const startDoc = await this.collection.doc(startAfterId).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      const snapshot = await query.get();
      const docs = snapshot.docs;

      const hasMore = docs.length > limit;
      const data = docs.slice(0, limit).map((doc) => ({
        id: doc.id,
        ...(doc.data() as T),
      }));

      return {
        data,
        nextCursor: hasMore ? docs[limit - 1].id : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching paginated data from ${this.collectionName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error fetching paginated data from ${this.collectionName}`,
      );
    }
  }
}
