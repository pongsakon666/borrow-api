import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateEquipmentDto, QueryEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'รายการครุภัณฑ์ (ค้นหา + แบ่งหน้า)' })
  findAll(@Query() query: QueryEquipmentDto) {
    return this.service.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'ประเภทครุภัณฑ์ทั้งหมด' })
  categories() {
    return this.service.categories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ครุภัณฑ์รายตัว' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มครุภัณฑ์' })
  create(@Body() dto: CreateEquipmentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขครุภัณฑ์' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'ลบครุภัณฑ์' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
