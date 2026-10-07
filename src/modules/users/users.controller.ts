import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { toProfile } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'รายชื่อสมาชิก (ใช้ในแถบขวาของ Dashboard)' })
  async findAll(@Query('limit') limit?: string) {
    const users = await this.service.findAll(Number(limit) || 20);
    return users.map(toProfile);
  }
}
