// src/servers/servers.controller.ts
import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async createServer(@Req() req: any, @Body() dto: CreateServerDto) {
    const userId = req.user.id || req.user.sub;
    return this.serversService.createServer(userId, dto);
  }

  @Get('team/:teamId')
  async getByTeam(@Param('teamId') teamId: string) {
    return this.serversService.getServersForTeam(teamId);
  }
}
