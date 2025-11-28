// src/modules/users/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔁 common "me" shape – matches AuthService.getCurrentUserFromPayload
  private readonly userMeSelect = {
    id: true,
    email: true,
    name: true,
    username: true,
    avatarUrl: true,
    timezone: true,
    createdAt: true,
    updatedAt: true,
    memberships: {
      select: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    },
  } as const;

  getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.userMeSelect,
    });
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!userId) {
      throw new BadRequestException('Cannot update profile: user id is missing');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        username: dto.username,
        timezone: dto.timezone,
      },
      select: this.userMeSelect,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    if (!userId) {
      throw new BadRequestException('Cannot update avatar: user id is missing');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: this.userMeSelect,
    });
  }
}
