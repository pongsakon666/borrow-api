import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { EquipmentService } from '@/modules/equipment/equipment.service';
import type { Paginated } from '@/modules/equipment/equipment.service';
import { ActivitiesService } from '@/modules/activities/activities.service';
import type { UserProfile } from '@/modules/users/user.entity';
import { CreateTransactionDto, QueryTransactionDto } from './dto/transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private readonly repo: Repository<Transaction>,
    private readonly equipment: EquipmentService,
    private readonly activities: ActivitiesService,
  ) {}

  async findAll(query: QueryTransactionDto): Promise<Paginated<Transaction>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo.createQueryBuilder('t');

    if (query.type) qb.andWhere('t.type = :type', { type: query.type });
    if (query.status) qb.andWhere('t.status = :status', { status: query.status });
    if (query.from) qb.andWhere('t.occurredAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('t.occurredAt <= :to', { to: new Date(query.to) });
    if (query.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('LOWER(t.userName) LIKE :search', { search })
            .orWhere('LOWER(t.equipmentName) LIKE :search', { search })
            .orWhere('LOWER(t.equipmentCode) LIKE :search', { search })
            .orWhere('LOWER(t.code) LIKE :search', { search })
            // ชื่อผู้จอง/หน่วยงานจากฟอร์มหน้าเว็บเก็บอยู่ใน note
            .orWhere('LOWER(t.note) LIKE :search', { search }),
        ),
      );
    }

    const [items, total] = await qb
      .orderBy('t.occurredAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Transaction> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('ไม่พบรายการ');
    return found;
  }

  async create(dto: CreateTransactionDto, actor: UserProfile): Promise<Transaction> {
    const equipment = await this.equipment.findOne(dto.equipmentId);
    const quantity = dto.quantity ?? 1;

    if (dto.type === 'borrow' && quantity > equipment.availableQuantity) {
      throw new BadRequestException(
        `ครุภัณฑ์คงเหลือ ${equipment.availableQuantity} ${equipment.unit} ไม่พอให้ยืม ${quantity}`,
      );
    }

    const entity = this.repo.create({
      code: await this.nextCode(dto.type),
      type: dto.type,
      status: dto.type === 'borrow' ? 'pending' : 'complete',
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentCode: equipment.code,
      userId: actor.id,
      userName: actor.name,
      quantity,
      occurredAt: new Date(),
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      returnedAt: dto.type === 'return' ? new Date() : undefined,
      note: dto.note ?? '',
    });

    const saved = await this.repo.save(entity);
    await this.equipment.adjustBorrowed(equipment.id, dto.type === 'borrow' ? quantity : -quantity);
    await this.activities.log({
      kind: dto.type,
      actorName: actor.name,
      message: `${dto.type === 'borrow' ? 'ยืม' : 'คืน'}${equipment.name}`,
    });

    return saved;
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const entity = await this.findOne(id);
    const wasActive = entity.status === 'pending' || entity.status === 'approved';

    entity.status = status;
    if (status === 'complete' && entity.type === 'borrow') entity.returnedAt = new Date();

    // ถูกปฏิเสธ/ยกเลิก → คืนจำนวนที่กันไว้ให้ครุภัณฑ์
    if (status === 'rejected' && wasActive && entity.type === 'borrow') {
      await this.equipment.adjustBorrowed(entity.equipmentId, -entity.quantity);
    }
    return this.repo.save(entity);
  }

  /** R1001T / T1001R — รันต่อจากเลขล่าสุด */
  private async nextCode(type: 'borrow' | 'return'): Promise<string> {
    const prefix = type === 'borrow' ? 'R' : 'T';
    const count = await this.repo.count();
    return `${prefix}${1000 + count + 1}${type === 'borrow' ? 'T' : 'R'}`;
  }
}
