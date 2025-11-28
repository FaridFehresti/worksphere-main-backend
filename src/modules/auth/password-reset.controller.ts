// src/modules/auth/password-reset.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/request-password-reset.dto';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    await this.service.requestReset(dto.email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.service.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully.' };
  }
}
