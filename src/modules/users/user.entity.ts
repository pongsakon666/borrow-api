import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'staff' | 'user';

@Entity('users')
export class User {
  @ApiProperty({ example: '8f0d3c2e-...' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin@example.com' })
  @Column({ unique: true })
  email: string;

  /** ไม่ส่งออก API — ใช้ toProfile() แทน */
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ApiProperty({ example: 'ผู้ดูแลระบบ' })
  @Column()
  name: string;

  @ApiProperty({ enum: ['admin', 'staff', 'user'], example: 'admin' })
  @Column({ default: 'user' })
  role: UserRole;

  @ApiProperty()
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** ข้อมูล user ที่ส่งออก API ได้ (ไม่มี hash) */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function toProfile(user: User): UserProfile {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
