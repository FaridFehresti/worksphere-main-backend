// src/modules/voice/voice.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface VoiceUser {
  userId: string;
  // extend later with username, avatar, etc.
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  // socket.id -> VoiceUser
  private readonly socketUserMap = new Map<string, VoiceUser>();

  // channelId -> Set<socket.id>
  private readonly channelSocketsMap = new Map<string, Set<string>>();

  registerSocket(socketId: string, user: VoiceUser): void {
    this.socketUserMap.set(socketId, user);
    this.logger.debug(`Socket registered: ${socketId} (userId=${user.userId})`);
  }

  /**
   * Remove socket from all channels and return the list of channelIds
   * it was in, so the gateway can broadcast "peer-left".
   */
  unregisterSocket(socketId: string): string[] {
    this.socketUserMap.delete(socketId);

    const affectedChannels: string[] = [];

    for (const [channelId, sockets] of this.channelSocketsMap.entries()) {
      if (sockets.delete(socketId)) {
        affectedChannels.push(channelId);
        this.logger.debug(
          `Socket ${socketId} removed from channel ${channelId}`,
        );

        if (sockets.size === 0) {
          this.channelSocketsMap.delete(channelId);
          this.logger.debug(`Channel ${channelId} is now empty and removed`);
        }
      }
    }

    return affectedChannels;
  }

  getUserBySocket(socketId: string): VoiceUser | undefined {
    return this.socketUserMap.get(socketId);
  }

  joinChannel(channelId: string, socketId: string): void {
    if (!this.channelSocketsMap.has(channelId)) {
      this.channelSocketsMap.set(channelId, new Set());
    }

    this.channelSocketsMap.get(channelId)!.add(socketId);
    this.logger.debug(`Socket ${socketId} joined channel ${channelId}`);
  }

  leaveChannel(channelId: string, socketId: string): void {
    const sockets = this.channelSocketsMap.get(channelId);
    if (!sockets) return;

    sockets.delete(socketId);
    this.logger.debug(`Socket ${socketId} left channel ${channelId}`);

    if (sockets.size === 0) {
      this.channelSocketsMap.delete(channelId);
      this.logger.debug(`Channel ${channelId} is now empty and removed`);
    }
  }

  getSocketsInChannel(channelId: string): string[] {
    return Array.from(this.channelSocketsMap.get(channelId) ?? []);
  }
}
