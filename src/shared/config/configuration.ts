/**
 * แปลง env ดิบเป็น config object ที่มี type — ใช้ผ่าน ConfigService<AppConfig, true>
 */
export interface AppConfig {
  app: {
    env: 'development' | 'test' | 'production';
    port: number;
    apiPrefix: string;
    corsOrigin: string[];
    logLevel: string;
  };
  database: {
    driver: 'postgres' | 'sqlite';
    url?: string;
    sqlitePath: string;
    synchronize: boolean;
    logging: boolean;
  };
  jwt: {
    secret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  redis: {
    driver: 'redis' | 'memory';
    host: string;
    port: number;
    password?: string;
  };
  rabbitmq: {
    enabled: boolean;
    url: string;
    queue: string;
  };
  kafka?: {
    brokers: string[];
    clientId: string;
    groupId: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
}

export default (): AppConfig => ({
  app: {
    env: (process.env.NODE_ENV as AppConfig['app']['env']) ?? 'development',
    port: Number(process.env.PORT ?? 3001),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    logLevel: process.env.LOG_LEVEL ?? 'info',
  },
  database: {
    driver: (process.env.DB_DRIVER as AppConfig['database']['driver']) ?? 'postgres',
    url: process.env.DATABASE_URL,
    sqlitePath: process.env.SQLITE_PATH ?? '.data/dev.sqlite',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  redis: {
    driver: (process.env.CACHE_DRIVER as AppConfig['redis']['driver']) ?? 'redis',
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  rabbitmq: {
    enabled: process.env.MESSAGING_ENABLED !== 'false',
    url: process.env.RABBITMQ_URL ?? '',
    queue: process.env.RABBITMQ_QUEUE ?? 'api_queue',
  },
  kafka: process.env.KAFKA_BROKERS
    ? {
        brokers: process.env.KAFKA_BROKERS.split(',').map((s) => s.trim()),
        clientId: process.env.KAFKA_CLIENT_ID ?? 'rent-borrow-api',
        groupId: process.env.KAFKA_GROUP_ID ?? 'api',
      }
    : undefined,
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
    limit: Number(process.env.THROTTLE_LIMIT ?? 100),
  },
});
