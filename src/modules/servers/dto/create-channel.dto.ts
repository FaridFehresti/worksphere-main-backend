// src/channels/dto/create-channel.dto.ts
import { ChannelType } from '@prisma/client';

export class CreateChannelDto {
  serverId: string;
  name: string;
  type: ChannelType; // 'TEXT' | 'VOICE'
}
