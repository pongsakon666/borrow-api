import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipment } from '@/modules/equipment/equipment.entity';
import { Transaction } from '@/modules/transactions/transaction.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, Transaction])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
