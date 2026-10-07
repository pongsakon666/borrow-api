import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

type Range = 'today' | 'week' | 'month' | 'year';
const RANGES: Range[] = ['today', 'week', 'month', 'year'];

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @ApiQuery({ name: 'range', enum: RANGES, required: false })
  @ApiOperation({ summary: 'ตัวเลขสรุป + ข้อมูลกราฟของหน้า Dashboard' })
  summary(@Query('range') range?: string) {
    const safe = RANGES.includes(range as Range) ? (range as Range) : 'month';
    return this.service.summary(safe);
  }
}
