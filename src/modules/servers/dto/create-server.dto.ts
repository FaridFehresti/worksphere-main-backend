// src/servers/dto/create-server.dto.ts
import { ServerType } from '@prisma/client';

export class CreateServerDto {
  teamId: string;
  name: string;
  type: ServerType; // 'TEXT' | 'VOICE'
}
