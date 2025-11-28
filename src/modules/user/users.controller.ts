// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/modules/files/files.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly files: FilesService,
  ) {}

  private getUserIdFromReq(req: any): string {
    const user = req.user;
    if (!user) {
      throw new BadRequestException('Invalid authenticated user payload');
    }

    // Support multiple common shapes: { sub }, { id }, { userId }
    const userId = user.sub || user.id || user.userId;

    if (!userId) {
      throw new BadRequestException('Invalid authenticated user payload');
    }

    return userId;
  }

  @Get('me')
  async getMe(@Req() req: any) {
    const userId = this.getUserIdFromReq(req);
    return this.users.getById(userId);
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = this.getUserIdFromReq(req);
    return this.users.updateProfile(userId, dto);   
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: any) {
    const userId = this.getUserIdFromReq(req);

    // TODO: validate mimetype & size
    const url = await this.files.uploadAvatar(userId, file);
    return this.users.updateAvatar(userId, url);
  }
}
