// src/modules/teams/teams.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/addd-member.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeamForUser(userId: string, dto: CreateTeamDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const team = await tx.team.create({
        data: {
          name: dto.name,
        },
      });

      const defaultRole = await tx.teamRole.create({
        data: {
          teamId: team.id,
          name: 'Member',
          isDefault: true,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          roleId: defaultRole.id,
        },
      });

      const textServer = await tx.server.create({
        data: {
          name: `${team.name} Text`,
          teamId: team.id,
          type: 'TEXT',
        },
      });

      const voiceServer = await tx.server.create({
        data: {
          name: `${team.name} Voice`,
          teamId: team.id,
          type: 'VOICE',
        },
      });

      await tx.channel.createMany({
        data: [
          {
            name: 'general',
            type: 'TEXT',
            serverId: textServer.id,
          },
          {
            name: 'General Voice',
            type: 'VOICE',
            serverId: voiceServer.id,
          },
        ],
      });

      return team;
    });
  }

  async getTeamsForUser(userId: string) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        servers: {
          include: {
            channels: true,
          },
        },
        members: {
          include: {
            user: true,
            role: true,
          },
        },
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  // 🔹 add member to a team
  async addMember(teamId: string, dto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultRole = await this.prisma.teamRole.findFirst({
      where: { teamId, isDefault: true },
    });

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        roleId: defaultRole?.id ?? null,
      },
    });
  }

  // 🔹 list members of a team
  async getMembers(teamId: string) {
    return this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: true,
        role: true,
      },
    });
  }
}
