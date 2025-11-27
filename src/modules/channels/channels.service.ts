// src/modules/channels/channels.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async createChannel(dto: CreateChannelDto) {
    // make sure server exists
    const server = await this.prisma.server.findUnique({
      where: { id: dto.serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        serverId: dto.serverId,
      },
    });
  }

  async getChannelsForServer(serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
