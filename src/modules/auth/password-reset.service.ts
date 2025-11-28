// src/modules/auth/password-reset.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { MailService } from 'src/modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) return; // avoid leaking

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const record = await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const token = `${record.id}.${rawToken}`;
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    await this.mail.sendPasswordReset(user.email, {
      displayName: user.name ?? undefined,
      resetLink,
    });
  }

  async resetPassword(tokenCombined: string, newPassword: string): Promise<void> {
    const [id, rawToken] = tokenCombined.split('.');
    if (!id || !rawToken) {
      throw new BadRequestException('Invalid token');
    }

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const valid = await bcrypt.compare(rawToken, record.tokenHash);
    if (!valid) {
      throw new BadRequestException('Invalid or expired token');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: newHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, used: false, id: { not: record.id } },
        data: { used: true },
      }),
    ]);
  }
}
