import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { UserProfile } from '@/modules/users/user.entity';
import {
  CreateTransactionDto,
  QueryTransactionDto,
  UpdateTransactionStatusDto,
} from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'รายการยืม-คืน (กรองตามประเภท/สถานะ/ช่วงวันที่)' })
  findAll(@Query() query: QueryTransactionDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'สร้างรายการยืมหรือคืน' })
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: UserProfile) {
    return this.service.create(dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'เปลี่ยนสถานะการดำเนินการ (อนุมัติ/ปฏิเสธ/เสร็จสิ้น)' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
