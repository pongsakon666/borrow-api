import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { EquipmentStatus } from '../equipment.entity';

const STATUSES: EquipmentStatus[] = ['ready', 'borrowed', 'maintenance', 'retired'];

export class CreateEquipmentDto {
  @ApiProperty({ example: 'RQ-871-OFF-3042' })
  @IsString()
  @MinLength(2, { message: 'รหัสครุภัณฑ์อย่างน้อย 2 ตัวอักษร' })
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'เก้าอี้สำนักงานเพื่อสุขภาพ Ergonomic Series A' })
  @IsString()
  @MinLength(2, { message: 'กรุณากรอกชื่อครุภัณฑ์' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'เฟอร์นิเจอร์สำนักงาน' })
  @IsString()
  @MinLength(1, { message: 'กรุณาเลือกประเภท' })
  category: string;

  @ApiPropertyOptional({ example: 'ฝ่ายบริหารทั่วไป' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 7800 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ราคาต้องเป็นตัวเลข' })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'ตัว' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'จำนวนต้องเป็นจำนวนเต็ม' })
  @Min(1, { message: 'จำนวนอย่างน้อย 1' })
  quantity?: number;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: EquipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString({}, { message: 'รูปแบบวันที่ไม่ถูกต้อง' })
  purchasedAt?: string;

  @ApiPropertyOptional({ description: 'true = บันทึกเป็นฉบับร่าง' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isDraft?: boolean;
}

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

export class QueryEquipmentDto {
  @ApiPropertyOptional({ description: 'ค้นหาจากชื่อ/รหัส' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: EquipmentStatus;

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
