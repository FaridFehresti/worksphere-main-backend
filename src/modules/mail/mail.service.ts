// src/modules/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendPasswordReset(
    email: string,
    args: { displayName?: string; resetLink: string },
  ) {
    const { displayName, resetLink } = args;

    const smtpHost = this.config.get<string>('SMTP_HOST');

    // 🟦 No SMTP configured → pure log, no attempt to send
    if (!smtpHost) {
      this.logger.warn(
        `SMTP_HOST not set. Logging password reset link instead of sending email.`,
      );
      this.logger.log(`Password reset link for ${email}: ${resetLink}`);
      return;
    }

    // 🟩 SMTP configured → try to send, but never crash the app
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Reset your WorkSphere password',
        html: `
          <p>Hello ${displayName ?? ''},</p>
          <p>You requested a password reset for your WorkSphere account.</p>
          <p>Click the link below to set a new password (valid for 1 hour):</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email queued for ${email}`);
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email via SMTP for ${email}. Logging link instead.`,
        err as any,
      );
      this.logger.log(`Fallback password reset link for ${email}: ${resetLink}`);
      // ❗ we do NOT rethrow here: the API should still return 200
    }
  }
}
