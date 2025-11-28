// src/modules/users/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
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
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    if (!userId) {
      throw new BadRequestException('Cannot update avatar: user id is missing');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }
}
