import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityKind } from './activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(@InjectRepository(Activity) private readonly repo: Repository<Activity>) {}

  log(input: {
    kind: ActivityKind;
    actorName: string;
    message: string;
    isNotification?: boolean;
  }): Promise<Activity> {
    return this.repo.save(this.repo.create(input));
  }

  /** ประวัติการทำรายการในระบบ */
  history(limit = 10): Promise<Activity[]> {
    return this.repo.find({
      where: { isNotification: false },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  /** การแจ้งเตือน */
  notifications(limit = 10): Promise<Activity[]> {
    return this.repo.find({
      where: { isNotification: true },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }

  unreadCount(): Promise<number> {
    return this.repo.count({ where: { isNotification: true, isRead: false } });
  }

  async markAllRead(): Promise<void> {
    await this.repo.update({ isNotification: true, isRead: false }, { isRead: true });
  }
}
