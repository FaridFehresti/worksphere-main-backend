import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { VoiceModule } from './modules/voice-chat/voice.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MailModule } from './modules/mail/mail.module';
import { PasswordResetModule } from './modules/auth/password-reset.module';
import { UsersModule } from './modules/user/users.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    VoiceModule,
    TeamsModule,
    ServersModule,
    ChannelsModule,
    MailModule,
    PasswordResetModule,
    UsersModule,
    FilesModule,
  ],
})
export class AppModule {}
