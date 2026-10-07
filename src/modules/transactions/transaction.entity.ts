import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** ยืม หรือ คืน */
export type TransactionType = 'borrow' | 'return';

/** สถานะการดำเนินการ (ตรงกับ tag ในตารางรายการล่าสุด) */
export type TransactionStatus = 'pending' | 'approved' | 'in_progress' | 'complete' | 'rejected';

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In Progress',
  complete: 'Complete',
  rejected: 'Rejected',
};

@Entity('transactions')
export class Transaction {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'R1001T', description: 'เลขที่รายการ' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ enum: ['borrow', 'return'] })
  @Column()
  type: TransactionType;

  @ApiProperty({ enum: ['pending', 'approved', 'in_progress', 'complete', 'rejected'] })
  @Column({ default: 'pending' })
  status: TransactionStatus;

  @ApiProperty()
  @Column()
  equipmentId: string;

  /** snapshot ไว้ให้รายงานย้อนหลังอ่านได้แม้ครุภัณฑ์ถูกแก้ชื่อ/ลบ */
  @ApiProperty()
  @Column()
  equipmentName: string;

  @ApiProperty()
  @Column()
  equipmentCode: string;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty()
  @Column()
  userName: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ description: 'วันที่ของรายการ' })
  @Column()
  occurredAt: Date;

  // `?: Date` ไม่ใช่ `Date | null` — ดูหมายเหตุใน equipment.entity.ts
  @ApiProperty({ required: false, description: 'กำหนดคืน (เฉพาะรายการยืม)' })
  @Column({ nullable: true })
  dueAt?: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  returnedAt?: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', default: '' })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
