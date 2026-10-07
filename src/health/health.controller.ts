import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

/**
 * Health endpoints สำหรับ Docker Compose / k8s probe (README §8.6)
 * - GET /health  → liveness  (โปรเซสยังตอบอยู่)
 * - GET /ready   → readiness (DB + Redis ต่อได้)
 * ไม่ผ่าน API_PREFIX เพื่อให้ probe ยิงตรงได้
 */
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
