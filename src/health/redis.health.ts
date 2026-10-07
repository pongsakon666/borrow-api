import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '@/shared/redis/redis.module';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  async isHealthy(key = 'redis') {
    const indicator = this.healthIndicatorService.check(key);

    // lite mode (CACHE_DRIVER=memory) — ไม่มี Redis ให้เช็ค
    if (!this.redis) return indicator.up({ driver: 'memory' });

    try {
      const pong: string = await this.redis.ping();
      return pong === 'PONG'
        ? indicator.up({ driver: 'redis' })
        : indicator.down({ message: `unexpected: ${pong}` });
    } catch (err) {
      return indicator.down({ message: (err as Error).message });
    }
  }
}
