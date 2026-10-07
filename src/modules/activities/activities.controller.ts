import { Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get('activities')
  @ApiOperation({ summary: 'ประวัติการทำรายการในระบบ' })
  history(@Query('limit') limit?: string) {
    return this.service.history(Number(limit) || 10);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'การแจ้งเตือน' })
  async notifications(@Query('limit') limit?: string) {
    const [items, unread] = await Promise.all([
      this.service.notifications(Number(limit) || 10),
      this.service.unreadCount(),
    ]);
    return { items, unread };
  }

  @Post('notifications/read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด' })
  markAllRead() {
    return this.service.markAllRead();
  }
}
