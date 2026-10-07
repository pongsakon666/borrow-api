import * as Joi from 'joi';

/**
 * Validation schema สำหรับ environment variables — fail fast ตอน start ถ้า env ขาด
 * (README §8.6: `.env.example` + validation schema ทุก service)
 * @nestjs/config 12 ใช้ Standard Schema — Joi 18 รองรับแล้ว · abortEarly ตั้งบน schema เพื่อรายงาน env ที่ขาดทั้งหมดทีเดียว
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),

  // sqlite = lite mode สำหรับ dev/ทดสอบ (ไม่ต้องมี Docker) · postgres = ของจริง
  DB_DRIVER: Joi.string().valid('postgres', 'sqlite').default('postgres'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .when('DB_DRIVER', { is: 'postgres', then: Joi.required(), otherwise: Joi.optional() }),
  SQLITE_PATH: Joi.string().default('.data/dev.sqlite'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // memory = lite mode (cache ใน process) · redis = ของจริง
  CACHE_DRIVER: Joi.string().valid('redis', 'memory').default('redis'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // false = lite mode (ไม่เชื่อม RabbitMQ — emit/send จะ error ถ้าเรียกใช้)
  MESSAGING_ENABLED: Joi.boolean().default(true),
  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .when('MESSAGING_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
  RABBITMQ_QUEUE: Joi.string().default('api_queue'),

  KAFKA_BROKERS: Joi.string().optional(),
  KAFKA_CLIENT_ID: Joi.string().optional(),
  KAFKA_GROUP_ID: Joi.string().optional(),

  THROTTLE_TTL: Joi.number().default(60_000),
  THROTTLE_LIMIT: Joi.number().default(100),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),
}).prefs({ abortEarly: false, allowUnknown: true });
