import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '@/modules/equipment/equipment.entity';
import { Transaction } from '@/modules/transactions/transaction.entity';

export interface SummaryCard {
  key: 'total' | 'borrowed' | 'returned' | 'available';
  label: string;
  value: number;
  /** % เทียบกับช่วงก่อนหน้า */
  change: number;
}

export interface DashboardSummary {
  cards: SummaryCard[];
  usage: { month: string; current: number; previous: number }[];
  popular: { name: string; value: number }[];
  yearly: { month: string; value: number }[];
  recent: Transaction[];
}

const MONTH_LABEL = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Equipment) private readonly equipment: Repository<Equipment>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
  ) {}

  async summary(range: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<DashboardSummary> {
    const now = new Date();
    const { start, previousStart } = resolveRange(range, now);

    const [totals, inRange, inPrevious, recent, popular] = await Promise.all([
      this.equipment
        .createQueryBuilder('e')
        .select('COALESCE(SUM(e.quantity), 0)', 'total')
        .addSelect('COALESCE(SUM(e.borrowedQuantity), 0)', 'borrowed')
        .getRawOne<{ total: string; borrowed: string }>(),
      this.countByType(start, now),
      this.countByType(previousStart, start),
      this.transactions.find({ order: { occurredAt: 'DESC' }, take: 5 }),
      this.popularEquipment(),
    ]);

    const total = Number(totals?.total ?? 0);
    const borrowed = Number(totals?.borrowed ?? 0);

    const cards: SummaryCard[] = [
      {
        key: 'total',
        label: 'ครุภัณฑ์ทั้งหมด',
        value: total,
        change: percentChange(inRange.all, inPrevious.all),
      },
      {
        key: 'borrowed',
        label: 'ยืมครุภัณฑ์',
        value: borrowed,
        change: percentChange(inRange.borrow, inPrevious.borrow),
      },
      {
        key: 'returned',
        label: 'คืนครุภัณฑ์',
        value: inRange.return,
        change: percentChange(inRange.return, inPrevious.return),
      },
      {
        key: 'available',
        label: 'ครุภัณฑ์คงเหลือ',
        value: Math.max(0, total - borrowed),
        change: percentChange(total - borrowed, total - borrowed - inRange.borrow),
      },
    ];

    return {
      cards,
      usage: await this.usageByMonth(now.getFullYear()),
      popular,
      yearly: await this.yearlyByMonth(now.getFullYear()),
      recent,
    };
  }

  /** จำนวนรายการรายเดือน ปีนี้เทียบปีที่แล้ว (กราฟเส้น "การใช้งาน") */
  private async usageByMonth(year: number) {
    const [current, previous] = await Promise.all([
      this.monthlyCounts(year),
      this.monthlyCounts(year - 1),
    ]);
    return MONTH_LABEL.slice(0, 7).map((month, i) => ({
      month,
      current: current[i],
      previous: previous[i],
    }));
  }

  /** จำนวนการยืมรายเดือน (กราฟแท่ง "สถิติประจำปี") */
  private async yearlyByMonth(year: number) {
    const counts = await this.monthlyCounts(year, 'borrow');
    return MONTH_LABEL.map((month, i) => ({ month, value: counts[i] }));
  }

  private async monthlyCounts(year: number, type?: 'borrow' | 'return'): Promise<number[]> {
    const qb = this.transactions
      .createQueryBuilder('t')
      .where('t.occurredAt >= :start', { start: new Date(year, 0, 1) })
      .andWhere('t.occurredAt < :end', { end: new Date(year + 1, 0, 1) });
    if (type) qb.andWhere('t.type = :type', { type });

    const rows = await qb.select('t.occurredAt', 'occurredAt').getRawMany<{ occurredAt: string }>();
    const buckets = new Array<number>(12).fill(0);
    for (const row of rows) {
      const month = new Date(row.occurredAt).getMonth();
      if (month >= 0 && month < 12) buckets[month] += 1;
    }
    return buckets;
  }

  /** ครุภัณฑ์ยอดนิยม — นับจากจำนวนครั้งที่ถูกยืม */
  private async popularEquipment() {
    const rows = await this.transactions
      .createQueryBuilder('t')
      .select('t.equipmentName', 'name')
      .addSelect('COUNT(*)', 'value')
      .where('t.type = :type', { type: 'borrow' })
      .groupBy('t.equipmentName')
      .orderBy('value', 'DESC')
      .limit(6)
      .getRawMany<{ name: string; value: string }>();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  private async countByType(from: Date, to: Date) {
    const rows = await this.transactions
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('t.occurredAt >= :from', { from })
      .andWhere('t.occurredAt < :to', { to })
      .groupBy('t.type')
      .getRawMany<{ type: string; count: string }>();

    const result = { borrow: 0, return: 0, all: 0 };
    for (const row of rows) {
      const count = Number(row.count);
      result.all += count;
      if (row.type === 'borrow') result.borrow = count;
      if (row.type === 'return') result.return = count;
    }
    return result;
  }
}

function resolveRange(range: string, now: Date) {
  const start = new Date(now);
  const previousStart = new Date(now);
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      previousStart.setDate(previousStart.getDate() - 1);
      previousStart.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      previousStart.setDate(previousStart.getDate() - 14);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      previousStart.setFullYear(previousStart.getFullYear() - 2);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
      previousStart.setMonth(previousStart.getMonth() - 2);
  }
  return { start, previousStart };
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}
