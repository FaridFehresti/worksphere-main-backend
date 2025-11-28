// src/modules/mail/mail.module.ts
import { MailerModule } from '@nestjs-modules/mailer';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('MailModule');
        const smtpHost = config.get<string>('SMTP_HOST');

        // 🟦 DEV MODE: no SMTP config → use jsonTransport (logs only, no network)
        if (!smtpHost) {
          logger.warn(
            'SMTP_HOST not set. Mailer will use jsonTransport (no real emails will be sent).',
          );

          return {
            transport: {
              jsonTransport: true, // Nodemailer: no real connection, just JSON output
            },
            defaults: {
              from: '"WorkSphere" <no-reply@worksphere.local>',
            },
          };
        }

        // 🟩 REAL SMTP MODE
        return {
          transport: {
            host: smtpHost,
            port: config.get<number>('SMTP_PORT') ?? 587,
            secure: false,
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: `"WorkSphere" <${config.get('SMTP_FROM') || 'no-reply@worksphere.io'}>`,
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
