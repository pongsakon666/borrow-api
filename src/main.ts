// ต้องมาก่อน import AppModule — decorator บางตัว (เช่น @Throttle ของ auth) อ่าน process.env
// ตอน class ถูกนิยาม ซึ่งเกิดก่อน ConfigModule.forRoot() จะโหลด .env
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './shared/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<AppConfig, true>);
  const { port, apiPrefix, corsOrigin, env } = config.get('app', { infer: true });

  // ── security / cors ────────────────────────────────────────────────
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: corsOrigin, credentials: true });

  // ── /api/v1 prefix (health ยิงตรงไม่ผ่าน prefix) ──────────────────
  app.setGlobalPrefix(apiPrefix, { exclude: ['health', 'ready'] });

  // ── global validation — กัน field แปลกหลุดเข้ามา (README §8.3) ────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger /docs (ใช้ generate TS client ให้ FE) ─────────────────
  if (env !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Rent & Borrow API')
      .setDescription('REST API สำหรับระบบยืม-เช่า')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc), {
      jsonDocumentUrl: 'docs/openapi.json',
    });
  }

  // ── RabbitMQ consumer (รับผลกลับจาก ML / worker) ──────────────────
  // MESSAGING_ENABLED=false (lite mode) → ข้าม ไม่ต้องมี RabbitMQ
  const { enabled, url, queue } = config.get('rabbitmq', { infer: true });
  if (enabled) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: { urls: [url], queue, queueOptions: { durable: true }, noAck: false },
    });
  }

  app.enableShutdownHooks();
  if (enabled) await app.startAllMicroservices();
  await app.listen(port);

  const { driver: dbDriver } = config.get('database', { infer: true });
  const { driver: cacheDriver } = config.get('redis', { infer: true });
  app
    .get(Logger)
    .log(
      `API listening on http://localhost:${port}/${apiPrefix} · docs at /docs ` +
        `[db=${dbDriver} cache=${cacheDriver} mq=${enabled ? 'on' : 'off'}]`,
    );
}

void bootstrap();
