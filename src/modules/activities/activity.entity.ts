import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ActivityKind = 'member_registered' | 'borrow' | 'return' | 'equipment' | 'system';

/** ประวัติการทำรายการในระบบ + การแจ้งเตือน (ใช้ตารางเดียว แยกด้วย isNotification) */
@Entity('activities')
export class Activity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: ['member_registered', 'borrow', 'return', 'equipment', 'system'] })
  @Column({ default: 'system' })
  kind: ActivityKind;

  @ApiProperty({ example: 'Johnathan' })
  @Column({ default: '' })
  actorName: string;

  @ApiProperty({ example: 'ยืมเครื่องปริ้น' })
  @Column()
  message: string;

  /** true = แสดงในกล่อง "การแจ้งเตือน" · false = แสดงในกล่อง "ประวัติการทำรายการ" */
  @ApiProperty()
  @Column({ default: false })
  isNotification: boolean;

  @ApiProperty()
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
