import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    const bucket = this.firebaseService.getStorage().bucket();
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    const filePath = `${folder}/${uniqueFilename}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Make file public to get a direct URL (or use signed URLs)
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    this.logger.log(`File uploaded successfully: ${publicUrl}`);
    return publicUrl;
  }
}
