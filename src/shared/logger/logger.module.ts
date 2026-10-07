import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '@/shared/config/configuration';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Structured log (JSON) ด้วย pino + correlation id (README §8.6)
 * - รับ x-correlation-id จาก FE ถ้ามี ไม่มีก็สร้างใหม่ · ส่งกลับใน response header
 * - dev ใช้ pino-pretty อ่านง่าย · prod เป็น JSON ล้วนให้ log stack เก็บ
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { env, logLevel } = config.get('app', { infer: true });
        return {
          pinoHttp: {
            level: logLevel,
            genReqId: (req, res) => {
              const existing = req.headers[CORRELATION_ID_HEADER];
              const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
              res.setHeader(CORRELATION_ID_HEADER, id);
              return id;
            },
            customProps: (req) => ({ correlationId: req.id }),
            autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            transport:
              env === 'development'
                ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
                : undefined,
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
