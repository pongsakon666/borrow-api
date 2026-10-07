import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { TransactionStatus, TransactionType } from '../transaction.entity';

const TYPES: TransactionType[] = ['borrow', 'return'];
const STATUSES: TransactionStatus[] = [
  'pending',
  'approved',
  'in_progress',
  'complete',
  'rejected',
];

export class CreateTransactionDto {
  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES, { message: 'ประเภทต้องเป็น borrow หรือ return' })
  type: TransactionType;

  @ApiProperty()
  @IsUUID('4', { message: 'กรุณาเลือกครุภัณฑ์' })
  equipmentId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'จำนวนอย่างน้อย 1' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'กำหนดคืน (เฉพาะรายการยืม)' })
  @IsOptional()
  @IsDateString({}, { message: 'รูปแบบวันที่ไม่ถูกต้อง' })
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTransactionStatusDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES, { message: 'สถานะไม่ถูกต้อง' })
  status: TransactionStatus;
}

export class QueryTransactionDto {
  @ApiPropertyOptional({ enum: TYPES })
  @IsOptional()
  @IsIn(TYPES)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'ค้นหาจากชื่อผู้ใช้/ครุภัณฑ์/รหัส' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
