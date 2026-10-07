import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  findAll(limit = 20): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'ASC' }, take: Math.min(limit, 100) });
  }

  async create(input: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.repo.create({
      email: input.email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      name: input.name,
      role: input.role ?? 'user',
    });
    return this.repo.save(user);
  }

  verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
