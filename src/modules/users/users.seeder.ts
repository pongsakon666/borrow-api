import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/shared/config/configuration';
import { UsersService } from './users.service';

/**
 * สร้าง user ตัวอย่างให้ dev/E2E ใช้ล็อกอินได้ทันที (ไม่ทำงานใน production)
 * admin@example.com / Passw0rd!
 */
@Injectable()
export class UsersSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('app.env', { infer: true }) === 'production') return;
    if ((await this.users.count()) > 0) return;

    await this.users.create({
      email: 'admin@example.com',
      password: 'Passw0rd!',
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
    });
    await this.users.create({
      email: 'user@example.com',
      password: 'Passw0rd!',
      name: 'ผู้ใช้ทั่วไป',
      role: 'user',
    });
    this.logger.log('seed: admin@example.com / user@example.com (รหัสผ่าน Passw0rd!)');
  }
}
