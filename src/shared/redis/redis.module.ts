import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule, type CacheOptions } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import Redis from 'ioredis';
import { AppConfig } from '@/shared/config/configuration';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Redis — 2 ทางใช้งาน
 * 1. CacheModule (cache-manager) → inject CACHE_MANAGER สำหรับ cache ทั่วไป / @CacheInterceptor
 * 2. REDIS_CLIENT (ioredis) → ใช้ตรงสำหรับ rate-limit counter, JWT blacklist, distributed lock, pub/sub
 *
 * CACHE_DRIVER=memory (lite mode) → cache อยู่ใน process · REDIS_CLIENT เป็น null
 */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): CacheOptions => {
        const { driver, host, port, password } = config.get('redis', { infer: true });
        if (driver === 'memory') {
          return { ttl: 60_000 };
        }
        const auth = password ? `:${encodeURIComponent(password)}@` : '';
        return {
          stores: [new Keyv({ store: new KeyvRedis(`redis://${auth}${host}:${port}`) })],
          ttl: 60_000,
        };
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { driver, host, port, password } = config.get('redis', { infer: true });
        if (driver === 'memory') return null;
        return new Redis({ host, port, password, lazyConnect: true, maxRetriesPerRequest: 3 });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
