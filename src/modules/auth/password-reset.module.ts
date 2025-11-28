// src/modules/auth/password-reset.module.ts
import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from 'src/core/database/prisma/prisma.service';
import { MailModule } from 'src/modules/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MailModule, ConfigModule],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, PrismaService],
})
export class PasswordResetModule {}
