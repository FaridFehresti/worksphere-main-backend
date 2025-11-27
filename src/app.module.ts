import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { VoiceModule } from './modules/voice-chat/voice.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    VoiceModule,
    TeamsModule,
    ServersModule,
    ChannelsModule,
  ],
})
export class AppModule {}
