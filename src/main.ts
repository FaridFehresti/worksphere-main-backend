// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP routes under /api
  app.setGlobalPrefix('api');

  // CORS for REST & base WS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://faridtech.org'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // 🔹 Explicit Socket.IO adapter (matches your @WebSocketGateway)
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
