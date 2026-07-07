import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('storage')
@UseGuards(FirebaseAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    const publicUrl = await this.storageService.uploadFile(file, folder || 'general');
    return { url: publicUrl, message: 'Archivo subido con éxito' };
  }
}
