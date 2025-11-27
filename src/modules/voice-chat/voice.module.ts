// src/modules/voice/voice.module.ts
import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { VoiceService } from './voice.service';
import { PrismaModule } from 'src/core/database/prisma/prisma.module';
import { AuthModule } from 'src/modules/auth/auth.module'; // ⬅ adjust path

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ⬅ brings in JwtService with your auth config
  ],
  providers: [VoiceGateway, VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
