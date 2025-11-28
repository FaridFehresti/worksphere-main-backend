// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/core/database/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Optional: soft check before hitting unique constraint
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email is already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        username: dto.username ?? null,
        timezone: dto.timezone ?? 'Etc/UTC',
        // avatarUrl is null by default
        // settings is {} by default (from Prisma)
      },
    });

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  // still used by /auth/me
  async getCurrentUserFromPayload(payload: { sub?: string; email?: string }) {
    const { sub, email } = payload;

    if (!sub && !email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.prisma.user.findUnique({
      where: sub ? { id: sub } : { email: email! },
      select: {
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
      },
    });
  }
}
