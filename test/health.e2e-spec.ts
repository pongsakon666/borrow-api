import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '@/app.module';

/**
 * ต้องมี PostgreSQL + Redis + RabbitMQ รันอยู่ (docker compose -f docker-compose.local.yml up -d)
 * และ .env ครบก่อนรัน `npm run test:e2e`
 */
describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });
});
