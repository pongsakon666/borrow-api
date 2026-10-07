import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from '@/shared/config/configuration';
import { Activity } from '@/modules/activities/activity.entity';
import { Equipment, EquipmentStatus } from '@/modules/equipment/equipment.entity';
import { Transaction, TransactionStatus } from '@/modules/transactions/transaction.entity';
import { UsersService } from '@/modules/users/users.service';

interface EquipmentSeed {
  name: string;
  category: string;
  department: string;
  price: number;
  quantity: number;
  unit: string;
}

/** ครุภัณฑ์ตัวอย่าง — จำนวนรวมกันแล้วได้หลักพันเพื่อให้การ์ดสรุปดูสมจริง */
const EQUIPMENT_SEED: EquipmentSeed[] = [
  {
    name: 'เครื่องปริ้นเตอร์ Laser MX-300',
    category: 'อุปกรณ์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 12500,
    quantity: 320,
    unit: 'เครื่อง',
  },
  {
    name: 'คีย์บอร์ดไร้สาย K380',
    category: 'อุปกรณ์คอมพิวเตอร์',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    price: 1290,
    quantity: 820,
    unit: 'อัน',
  },
  {
    name: 'เมาส์ไร้สาย M590',
    category: 'อุปกรณ์คอมพิวเตอร์',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    price: 990,
    quantity: 760,
    unit: 'อัน',
  },
  {
    name: 'กล้องถ่ายรูป Mirrorless A7',
    category: 'อุปกรณ์โสตทัศนูปกรณ์',
    department: 'ฝ่ายประชาสัมพันธ์',
    price: 68000,
    quantity: 45,
    unit: 'ตัว',
  },
  {
    name: 'จอคอมพิวเตอร์ 27 นิ้ว 4K',
    category: 'อุปกรณ์คอมพิวเตอร์',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    price: 9800,
    quantity: 540,
    unit: 'จอ',
  },
  {
    name: 'โทรทัศน์ LED 55 นิ้ว',
    category: 'อุปกรณ์โสตทัศนูปกรณ์',
    department: 'ฝ่ายอาคารสถานที่',
    price: 21500,
    quantity: 62,
    unit: 'เครื่อง',
  },
  {
    name: 'เก้าอี้สำนักงานเพื่อสุขภาพ Ergonomic Series A',
    category: 'เฟอร์นิเจอร์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 7800,
    quantity: 1250,
    unit: 'ตัว',
  },
  {
    name: 'โต๊ะทำงานปรับระดับไฟฟ้า',
    category: 'เฟอร์นิเจอร์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 15900,
    quantity: 480,
    unit: 'ตัว',
  },
  {
    name: 'โน้ตบุ๊ก ThinkPad T14',
    category: 'อุปกรณ์คอมพิวเตอร์',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    price: 42000,
    quantity: 310,
    unit: 'เครื่อง',
  },
  {
    name: 'เครื่องฉายโปรเจกเตอร์ Full HD',
    category: 'อุปกรณ์โสตทัศนูปกรณ์',
    department: 'ฝ่ายอาคารสถานที่',
    price: 28900,
    quantity: 85,
    unit: 'เครื่อง',
  },
  {
    name: 'เครื่องสแกนเอกสาร ADF',
    category: 'อุปกรณ์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 18500,
    quantity: 120,
    unit: 'เครื่อง',
  },
  {
    name: 'ไมโครโฟนไร้สาย UHF',
    category: 'อุปกรณ์โสตทัศนูปกรณ์',
    department: 'ฝ่ายประชาสัมพันธ์',
    price: 8900,
    quantity: 210,
    unit: 'ชุด',
  },
  {
    name: 'เครื่องปรับอากาศ 18000 BTU',
    category: 'ครุภัณฑ์อาคาร',
    department: 'ฝ่ายอาคารสถานที่',
    price: 32000,
    quantity: 180,
    unit: 'เครื่อง',
  },
  {
    name: 'ตู้เอกสารเหล็ก 4 ลิ้นชัก',
    category: 'เฟอร์นิเจอร์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 5400,
    quantity: 640,
    unit: 'ตู้',
  },
  {
    name: 'เครื่องทำลายเอกสาร',
    category: 'อุปกรณ์สำนักงาน',
    department: 'ฝ่ายบริหารทั่วไป',
    price: 9200,
    quantity: 95,
    unit: 'เครื่อง',
  },
  {
    name: 'แท็บเล็ต iPad 10.9 นิ้ว',
    category: 'อุปกรณ์คอมพิวเตอร์',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    price: 19900,
    quantity: 150,
    unit: 'เครื่อง',
  },
  {
    name: 'ขาตั้งกล้องสามขา Pro',
    category: 'อุปกรณ์โสตทัศนูปกรณ์',
    department: 'ฝ่ายประชาสัมพันธ์',
    price: 4500,
    quantity: 90,
    unit: 'ตัว',
  },
  {
    name: 'เครื่องวัดอุณหภูมิอินฟราเรด',
    category: 'ครุภัณฑ์วิทยาศาสตร์',
    department: 'ฝ่ายความปลอดภัย',
    price: 3200,
    quantity: 140,
    unit: 'เครื่อง',
  },
  {
    name: 'วิทยุสื่อสาร VHF',
    category: 'ครุภัณฑ์สื่อสาร',
    department: 'ฝ่ายความปลอดภัย',
    price: 6800,
    quantity: 260,
    unit: 'เครื่อง',
  },
  {
    name: 'รถเข็นอเนกประสงค์',
    category: 'ครุภัณฑ์อาคาร',
    department: 'ฝ่ายอาคารสถานที่',
    price: 4800,
    quantity: 75,
    unit: 'คัน',
  },
];

const MEMBERS: Array<{ email: string; name: string; role: 'staff' | 'user' }> = [
  { email: 'natali.craig@example.com', name: 'Natali Craig', role: 'staff' },
  { email: 'drew.cano@example.com', name: 'Drew Cano', role: 'staff' },
  { email: 'andi.lane@example.com', name: 'Andi Lane', role: 'user' },
  { email: 'koray.okumus@example.com', name: 'Koray Okumus', role: 'user' },
  { email: 'kate.morrison@example.com', name: 'Kate Morrison', role: 'staff' },
  { email: 'melody.macy@example.com', name: 'Melody Macy', role: 'user' },
  { email: 'orlando.diggs@example.com', name: 'Orlando Diggs', role: 'user' },
  { email: 'byewind@example.com', name: 'ByeWind', role: 'user' },
];

const STATUSES: TransactionStatus[] = [
  'in_progress',
  'complete',
  'pending',
  'approved',
  'rejected',
];

/**
 * ข้อมูลตัวอย่างสำหรับ dev/E2E — ครุภัณฑ์ สมาชิก รายการยืม-คืนย้อนหลัง 2 ปี
 * ไม่ทำงานใน production และข้ามทันทีถ้ามีข้อมูลอยู่แล้ว
 */
@Injectable()
export class DemoSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeeder.name);

  /** seed แบบ deterministic — ข้อมูลเหมือนเดิมทุกครั้ง E2E จึงเชื่อถือได้ */
  private seed = 20260923;

  constructor(
    @InjectRepository(Equipment) private readonly equipment: Repository<Equipment>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
    private readonly users: UsersService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('app.env', { infer: true }) === 'production') return;
    if ((await this.equipment.count()) > 0) return;

    const equipment = await this.seedEquipment();
    const members = await this.seedMembers();
    await this.seedTransactions(equipment, members);
    await this.seedActivities();

    this.logger.log(
      `seed: ครุภัณฑ์ ${equipment.length} รายการ · สมาชิก ${members.length} คน · รายการยืม-คืน ${await this.transactions.count()} รายการ`,
    );
  }

  private seedEquipment(): Promise<Equipment[]> {
    const rows = EQUIPMENT_SEED.map((item, i) => {
      const borrowedQuantity = Math.floor(item.quantity * (0.2 + this.random() * 0.45));
      const status: EquipmentStatus = borrowedQuantity >= item.quantity ? 'borrowed' : 'ready';
      return this.equipment.create({
        code: `RQ-${100 + i}-OFF-${3000 + i * 7}`,
        name: item.name,
        category: item.category,
        department: item.department,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        borrowedQuantity,
        status,
        description: `${item.name} สำหรับใช้งานภายใน${item.department} อยู่ในสภาพพร้อมใช้งาน`,
        images: [],
        purchasedAt: new Date(2024, i % 12, 1 + (i % 27)),
      });
    });
    return this.equipment.save(rows);
  }

  private async seedMembers(): Promise<Array<{ id: string; name: string }>> {
    const created: Array<{ id: string; name: string }> = [];
    for (const member of MEMBERS) {
      const existing = await this.users.findByEmail(member.email);
      created.push(
        existing ??
          (await this.users.create({
            email: member.email,
            name: member.name,
            password: 'Passw0rd!',
            role: member.role,
          })),
      );
    }
    return created;
  }

  private async seedTransactions(
    equipment: Equipment[],
    members: Array<{ id: string; name: string }>,
  ): Promise<void> {
    const rows: Transaction[] = [];
    const now = new Date();

    for (let i = 0; i < 520; i++) {
      const item = equipment[Math.floor(this.random() * equipment.length)];
      const member = members[Math.floor(this.random() * members.length)];
      const type: 'borrow' | 'return' = this.random() < 0.62 ? 'borrow' : 'return';

      // กระจายย้อนหลัง 23 เดือน ถ่วงน้ำหนักให้เดือนล่าสุดมีรายการเยอะกว่า
      const monthsAgo = Math.floor(Math.pow(this.random(), 1.6) * 23);
      const occurredAt = new Date(now);
      occurredAt.setMonth(occurredAt.getMonth() - monthsAgo);
      occurredAt.setDate(1 + Math.floor(this.random() * 27));

      const dueAt = new Date(occurredAt);
      dueAt.setDate(dueAt.getDate() + 7 + Math.floor(this.random() * 21));

      rows.push(
        this.transactions.create({
          code: `${type === 'borrow' ? 'R' : 'T'}${1000 + i}${type === 'borrow' ? 'T' : 'R'}`,
          type,
          status: STATUSES[Math.floor(this.random() * STATUSES.length)],
          equipmentId: item.id,
          equipmentName: item.name,
          equipmentCode: item.code,
          userId: member.id,
          userName: member.name,
          quantity: 1 + Math.floor(this.random() * 3),
          occurredAt,
          dueAt: type === 'borrow' ? dueAt : undefined,
          returnedAt: type === 'return' ? occurredAt : undefined,
          note: '',
        }),
      );
    }
    await this.transactions.save(rows, { chunk: 100 });
  }

  private async seedActivities(): Promise<void> {
    const rows: Activity[] = [
      this.activities.create({
        kind: 'member_registered',
        actorName: 'ระบบ',
        message: 'สมัครสมาชิกใหม่',
        isNotification: true,
        isRead: false,
      }),
      this.activities.create({
        kind: 'borrow',
        actorName: 'Natali Craig',
        message: 'ขอยืมกล้องถ่ายรูป Mirrorless A7',
        isNotification: true,
        isRead: false,
      }),
    ];

    for (const message of [
      'ยืมเครื่องปริ้นเตอร์ Laser MX-300',
      'คืนคีย์บอร์ดไร้สาย K380',
      'ยืมโน้ตบุ๊ก ThinkPad T14',
      'ยืมจอคอมพิวเตอร์ 27 นิ้ว 4K',
      'คืนไมโครโฟนไร้สาย UHF',
    ]) {
      rows.push(
        this.activities.create({
          kind: message.startsWith('ยืม') ? 'borrow' : 'return',
          actorName: 'Johnathan',
          message,
          isNotification: false,
        }),
      );
    }

    const saved = await this.activities.save(rows);

    // ย้อนเวลาให้ไล่กันทีละนาที จะได้แสดงเป็น "x minutes ago" เหมือนดีไซน์
    const now = Date.now();
    for (const [i, row] of saved.entries()) {
      await this.activities.update(row.id, { createdAt: new Date(now - (59 - i) * 60_000) });
    }
  }

  /** mulberry32 — pseudo random ที่ให้ผลเดิมทุกครั้ง */
  private random(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
