// src/modules/voice/voice.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  Logger,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { VoiceService, VoiceUser } from './voice.service';
import { PrismaService } from 'src/core/database/prisma/prisma.service';

interface JoinChannelPayload {
  channelId: string;
}

interface LeaveChannelPayload {
  channelId: string;
}

type SignalType = 'offer' | 'answer' | 'ice-candidate';

interface SignalPayload {
  targetSocketId: string;
  type: SignalType;
  data: any;
}

@WebSocketGateway({
  namespace: '/voice',
  cors: {
    origin: ['http://localhost:3000', 'https://faridtech.org'],
    credentials: true, // we don't rely on cookies for auth
  },
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceGateway.name);

  constructor(
    private readonly voiceService: VoiceService,
    private readonly prisma: PrismaService, // DB checks: channels / teams / roles
    private readonly jwtService: JwtService, // real JWT auth
  ) {}

  /* ---------------- CONNECTION / AUTH ---------------- */

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(
      `🔔 WS incoming connection: id=${client.id}, url=${client.handshake.url}`,
    );

    try {
      const user = await this.authenticateClient(client);

      this.voiceService.registerSocket(client.id, user);

      this.logger.log(
        `✅ Client connected: ${client.id} (userId=${user.userId})`,
      );
    } catch (error: any) {
      this.logger.warn(
        `❌ Client connection rejected (${client.id}): ${error?.message}`,
      );
      client.disconnect();
    }
  }


  handleDisconnect(client: Socket): void {
    const channelsLeft = this.voiceService.unregisterSocket(client.id);

    // Notify remaining peers in each channel
    for (const channelId of channelsLeft) {
      client.to(channelId).emit('peer-left', {
        channelId,
        socketId: client.id,
      });
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Auth:
   * - Reads a token from `client.handshake.auth.token` OR `Authorization` header
   * - Verifies JWT using the same secret/config as HTTP (AuthModule)
   * - Returns `{ userId }` matching your `User.id` in the DB
   */
  private async authenticateClient(client: Socket): Promise<VoiceUser> {
    let token: string | undefined =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers['authorization'] as string | undefined);

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    // Support "Bearer xxx" or raw token
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      const payload: any = await this.jwtService.verifyAsync(token);

      // 🔎 IMPORTANT: adapt this to how you sign the JWT in AuthService
      // e.g. sign({ sub: user.id, email: user.email })
      const userId: string | undefined =
        payload.sub || payload.id || payload.userId;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload (no user id)');
      }

      // Optional debug:
      // this.logger.debug(`WS authenticated user: ${userId}`);

      return { userId };
    } catch (e: any) {
      this.logger.warn(`WS JWT verify failed: ${e?.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /* ---------------- JOIN / LEAVE CHANNELS ---------------- */

  @SubscribeMessage('join-channel')
  async handleJoinChannel(
    @MessageBody() payload: JoinChannelPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { channelId } = payload;
    const user = this.voiceService.getUserBySocket(client.id);

    if (!user) {
      throw new UnauthorizedException('Unauthenticated socket');
    }

    // 1) Validate channel exists + is VOICE + user is member of team
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.type !== 'VOICE') {
      throw new ForbiddenException('Cannot join a non-voice channel');
    }

    const team = channel.server.team;
    const isMember = team.members.some(
      (m) => m.userId === user.userId,
    );

    if (!isMember) {
      throw new ForbiddenException(
        'You are not a member of this team and cannot join this voice channel',
      );
    }

    // 2) Add to in-memory voice channel + socket.io room
    this.voiceService.joinChannel(channelId, client.id);
    client.join(channelId);

    // 3) Notify this client of existing peers (for WebRTC mesh setup)
    const existingSockets = this.voiceService
      .getSocketsInChannel(channelId)
      .filter((id) => id !== client.id);

    client.emit('channel-joined', {
      channelId,
      existingPeers: existingSockets,
    });

    // 4) Notify others that a new peer joined
    client.to(channelId).emit('peer-joined', {
      channelId,
      socketId: client.id,
      userId: user.userId,
    });

    this.logger.debug(
      `Socket ${client.id} (userId=${user.userId}) joined channel ${channelId}`,
    );
  }

  @SubscribeMessage('leave-channel')
  handleLeaveChannel(
    @MessageBody() payload: LeaveChannelPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const { channelId } = payload;

    this.voiceService.leaveChannel(channelId, client.id);
    client.leave(channelId);

    client.to(channelId).emit('peer-left', {
      channelId,
      socketId: client.id,
    });

    this.logger.debug(`Socket ${client.id} left channel ${channelId}`);
  }

  /* ---------------- SIGNAL RELAY (WEBRTC) ---------------- */

  @SubscribeMessage('signal')
  handleSignal(
    @MessageBody() payload: SignalPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const { targetSocketId, type, data } = payload;

    const fromUser = this.voiceService.getUserBySocket(client.id);
    if (!fromUser) {
      throw new UnauthorizedException('Unauthenticated socket');
    }

    this.server.to(targetSocketId).emit('signal', {
      fromSocketId: client.id,
      type,
      data,
    });

    this.logger.debug(
      `Signal from ${client.id} -> ${targetSocketId} [${type}]`,
    );
  }
}
