// src/modules/files/files.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadRoot: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const envUploadDir = this.config.get<string>('UPLOAD_DIR');
    this.uploadRoot = envUploadDir || join(process.cwd(), 'uploads');

    const rawBase = this.config.get<string>('PUBLIC_BASE_URL') || '';
    this.publicBaseUrl = rawBase.replace(/\/+$/, '');
  }

  private buildPublicUrl(relativePath: string): string {
    const cleanRelative = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;

    if (!this.publicBaseUrl) {
      const port = process.env.PORT ?? 5000;
      return `http://localhost:${port}${cleanRelative}`;
    }

    return `${this.publicBaseUrl}${cleanRelative}`;
  }

  async uploadAvatar(userId: string, file: any): Promise<string> {
    try {
      const avatarDir = join(this.uploadRoot, 'avatars', userId);
      await fs.mkdir(avatarDir, { recursive: true });

      const ext = file.originalname.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      const filePath = join(avatarDir, filename);

      await fs.writeFile(filePath, file.buffer);

      const relativePath = `/uploads/avatars/${userId}/${filename}`;
      return this.buildPublicUrl(relativePath);
    } catch (err) {
      throw new InternalServerErrorException('Failed to save avatar');
    }
  }
}
