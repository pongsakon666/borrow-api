import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** สถานะครุภัณฑ์ */
export type EquipmentStatus = 'ready' | 'borrowed' | 'maintenance' | 'retired';

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  ready: 'พร้อมใช้งาน',
  borrowed: 'ถูกยืมอยู่',
  maintenance: 'ซ่อมบำรุง',
  retired: 'ปลดระวาง',
};

@Entity('equipment')
export class Equipment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'RQ-871-OFF-3042', description: 'รหัสครุภัณฑ์ (ไม่ซ้ำ)' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 'เก้าอี้สำนักงานเพื่อสุขภาพ Ergonomic Series A' })
  @Column()
  name: string;

  @ApiProperty({ example: 'เฟอร์นิเจอร์สำนักงาน' })
  @Column()
  category: string;

  @ApiProperty({ example: 'ฝ่ายบริหารทั่วไป', description: 'หน่วยงานผู้รับผิดชอบ' })
  @Column({ default: '' })
  department: string;

  @ApiProperty({ example: 7800 })
  @Column({ type: 'float', default: 0 })
  price: number;

  @ApiProperty({ example: 'ตัว' })
  @Column({ default: 'ชิ้น' })
  unit: string;

  @ApiProperty({ example: 50, description: 'จำนวนทั้งหมดที่มี' })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ example: 12, description: 'จำนวนที่ถูกยืมอยู่ขณะนี้' })
  @Column({ type: 'int', default: 0 })
  borrowedQuantity: number;

  @ApiProperty({ enum: ['ready', 'borrowed', 'maintenance', 'retired'] })
  @Column({ default: 'ready' })
  status: EquipmentStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'text', default: '' })
  description: string;

  @ApiProperty({ type: [String], description: 'ชื่อไฟล์รูป' })
  @Column('simple-json', { default: '[]' })
  images: string[];

  // ใช้ `?: Date` ไม่ใช่ `Date | null` — union ทำให้ reflect-metadata เห็น type เป็น Object
  // แล้ว TypeORM จะ error: Data type "Object" ... is not supported
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  purchasedAt?: Date;

  /** draft = ยังกรอกไม่เสร็จ (กด Save as Draft ใน wizard) */
  @ApiProperty()
  @Column({ default: false })
  isDraft: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** จำนวนที่ยังให้ยืมได้ */
  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.borrowedQuantity);
  }
}
