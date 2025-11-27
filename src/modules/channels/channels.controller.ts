// src/modules/channels/channels.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  // POST /channels
  @Post()
  async createChannel(@Body() dto: CreateChannelDto) {
    return this.channelsService.createChannel(dto);
  }

  // GET /channels/server/:serverId
  @Get('server/:serverId')
  async getChannelsForServer(@Param('serverId') serverId: string) {
    return this.channelsService.getChannelsForServer(serverId);
  }
}
