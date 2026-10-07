import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '@/shared/config/configuration';

/**
 * PostgreSQL ผ่าน TypeORM
 * - entities auto-load จากทุก module ที่ใช้ TypeOrmModule.forFeature()
 * - synchronize ปิดเป็น default — ใช้ migration เท่านั้น (README §8.3)
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('database', { infer: true });
        const env = config.get('app.env', { infer: true });

        // lite mode — SQLite เป็นไฟล์ ไม่ต้องมี Docker · schema sync อัตโนมัติ (dev เท่านั้น)
        if (db.driver === 'sqlite') {
          return {
            type: 'better-sqlite3' as const,
            database: db.sqlitePath,
            autoLoadEntities: true,
            synchronize: true,
            logging: db.logging,
          };
        }

        return {
          type: 'postgres' as const,
          url: db.url,
          autoLoadEntities: true,
          synchronize: env !== 'production' && db.synchronize,
          logging: db.logging,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsTableName: 'typeorm_migrations',
          migrationsRun: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
