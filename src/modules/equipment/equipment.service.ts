import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Equipment } from './equipment.entity';
import { CreateEquipmentDto, QueryEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class EquipmentService {
  constructor(@InjectRepository(Equipment) private readonly repo: Repository<Equipment>) {}

  async findAll(query: QueryEquipmentDto): Promise<Paginated<Equipment>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.repo.createQueryBuilder('e').where('e.isDraft = :draft', { draft: false });

    if (query.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('LOWER(e.name) LIKE :search', { search })
            .orWhere('LOWER(e.code) LIKE :search', { search }),
        ),
      );
    }
    if (query.category) qb.andWhere('e.category = :category', { category: query.category });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });

    const [items, total] = await qb
      .orderBy('e.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Equipment> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('ไม่พบครุภัณฑ์');
    return found;
  }

  /** ประเภททั้งหมดที่มีอยู่ — ใช้เติม dropdown ในฟอร์ม */
  async categories(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select('DISTINCT e.category', 'category')
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category).filter(Boolean);
  }

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException(`รหัสครุภัณฑ์ ${dto.code} ถูกใช้ไปแล้ว`);
    }
    const entity = this.repo.create({
      ...dto,
      purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : undefined,
      images: dto.images ?? [],
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const entity = await this.findOne(id);
    if (dto.code && dto.code !== entity.code) {
      if (await this.repo.findOne({ where: { code: dto.code } })) {
        throw new ConflictException(`รหัสครุภัณฑ์ ${dto.code} ถูกใช้ไปแล้ว`);
      }
    }
    Object.assign(entity, dto, {
      purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : entity.purchasedAt,
    });
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    await this.repo.remove(await this.findOne(id));
  }

  /** ใช้ตอนสร้างรายการยืม/คืน เพื่ออัปเดตจำนวนคงเหลือ */
  async adjustBorrowed(id: string, delta: number): Promise<Equipment> {
    const entity = await this.findOne(id);
    entity.borrowedQuantity = Math.min(
      entity.quantity,
      Math.max(0, entity.borrowedQuantity + delta),
    );
    entity.status = entity.borrowedQuantity >= entity.quantity ? 'borrowed' : 'ready';
    return this.repo.save(entity);
  }
}
