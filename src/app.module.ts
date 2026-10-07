import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration, { AppConfig } from '@/shared/config/configuration';
import { envValidationSchema } from '@/shared/config/env.validation';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { MessagingModule } from '@/shared/messaging/messaging.module';
import { RedisModule } from '@/shared/redis/redis.module';
import { HealthModule } from '@/health/health.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { EquipmentModule } from '@/modules/equipment/equipment.module';
import { TransactionsModule } from '@/modules/transactions/transactions.module';
import { ActivitiesModule } from '@/modules/activities/activities.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { SeedModule } from '@/modules/seed/seed.module';

/**
 * Root module — modular monolith (README §4, §8.3)
 * โมดูลธุรกิจ (auth / users / items / rentals / ...) เพิ่มใน src/modules/ แล้ว import ที่นี่
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    LoggerModule,
    DatabaseModule,
    RedisModule,
    MessagingModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { ttl, limit } = config.get('throttle', { infer: true });
        return { throttlers: [{ ttl, limit }] };
      },
    }),
    HealthModule,

    // ── business modules (src/modules/*) ──────────────────────────────
    UsersModule,
    AuthModule,
    EquipmentModule,
    TransactionsModule,
    ActivitiesModule,
    DashboardModule,
    SeedModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
