import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '@/modules/activities/activity.entity';
import { Equipment } from '@/modules/equipment/equipment.entity';
import { Transaction } from '@/modules/transactions/transaction.entity';
import { UsersModule } from '@/modules/users/users.module';
import { DemoSeeder } from './demo.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, Transaction, Activity]), UsersModule],
  providers: [DemoSeeder],
})
export class SeedModule {}
