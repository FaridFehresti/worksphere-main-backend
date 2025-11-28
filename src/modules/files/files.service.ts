// src/modules/files/files.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  private uploadRoot: string;
  private publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    // Disk root for uploads (e.g. /var/worksphere/uploads)
    this.uploadRoot =
      this.config.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');

    // Base URL for building public URLs
    this.publicBaseUrl =
      this.config.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3000';
  }

  /**
   * Save avatar to disk and return the public URL
   */
  async uploadAvatar(userId: string, file: any): Promise<string> {
    // e.g. /var/worksphere/uploads/avatars/<userId>/
    const avatarsDir = join(this.uploadRoot, 'avatars', userId);
    await fs.mkdir(avatarsDir, { recursive: true });

    const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    const fileName = `${Date.now()}-${safeName}`;
    const filePath = join(avatarsDir, fileName);

    // Multer gives us file.buffer (with memory storage)
    await fs.writeFile(filePath, file.buffer);

    // This path is served by ServeStaticModule at /uploads
    const relativePath = `/uploads/avatars/${userId}/${fileName}`;

    // Full URL stored in DB
    return `${this.publicBaseUrl}${relativePath}`;
  }
}
