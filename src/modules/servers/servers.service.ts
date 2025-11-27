// src/servers/servers.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { CreateServerDto } from './dto/create-server.dto';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  async createServer(userId: string, dto: CreateServerDto) {
    // You can check if user is member of dto.teamId
    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId: dto.teamId, userId },
    });

    if (!isMember) throw new ForbiddenException('Not a team member');

    return this.prisma.server.create({
      data: {
        name: dto.name,
        teamId: dto.teamId,
        type: dto.type,
      },
    });
  }

  async getServersForTeam(teamId: string) {
    return this.prisma.server.findMany({
      where: { teamId },
      include: {
        channels: true,
      },
    });
  }
}
