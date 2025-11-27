// src/servers/servers.module.ts
import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { TeamsModule } from '../teams/teams.module';
import { PrismaService } from 'src/core/database/prisma/prisma.service';

@Module({
  imports: [TeamsModule],
  controllers: [ServersController],
  providers: [ServersService, PrismaService],
})
export class ServersModule {}
