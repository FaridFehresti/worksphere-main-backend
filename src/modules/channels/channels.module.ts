// src/modules/channels/channels.module.ts
import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { PrismaService } from 'src/core/database/prisma/prisma.service';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService, PrismaService],
})
export class ChannelsModule {}
