import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppConfig } from '@/shared/config/configuration';

/** token สำหรับ inject ClientProxy: `@Inject(TASK_QUEUE) private readonly client: ClientProxy` */
export const TASK_QUEUE = 'TASK_QUEUE';

/**
 * Messaging abstraction (README §8.1) — โค้ดธุรกิจไม่ควรรู้ว่าข้างใต้เป็น RabbitMQ / Kafka
 * เฟสแรกใช้ RabbitMQ อย่างเดียว · สลับ transport ที่นี่ที่เดียว
 *
 * ใช้งาน: this.client.emit('ml.predict', payload)   → fire-and-forget (event)
 *         this.client.send('report.generate', dto)  → request/response
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: TASK_QUEUE,
        inject: [ConfigService],
        useFactory: (config: ConfigService<AppConfig, true>) => {
          const { url, queue } = config.get('rabbitmq', { infer: true });
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue,
              queueOptions: { durable: true },
              persistent: true,
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
