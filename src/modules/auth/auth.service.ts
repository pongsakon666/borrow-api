import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '@/shared/config/configuration';
import { toProfile, User, UserProfile } from '@/modules/users/user.entity';
import { UsersService } from '@/modules/users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * ตรวจ email/password — ข้อความ error เหมือนกันทั้งกรณีไม่พบ user และรหัสผิด
   * เพื่อไม่ให้เดาได้ว่าอีเมลนี้มีอยู่จริงหรือไม่ (user enumeration)
   */
  async validateUser(email: string, password: string): Promise<User> {
    const invalid = new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) throw invalid;
    if (!(await this.users.verifyPassword(user, password))) throw invalid;
    return user;
  }

  async login(email: string, password: string): Promise<TokenPair> {
    return this.issueTokens(await this.validateUser(email, password));
  }

  async refresh(refreshToken?: string): Promise<TokenPair> {
    if (!refreshToken) throw new UnauthorizedException('ไม่พบ refresh token');
    const { secret } = this.config.get('jwt', { infer: true });

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('refresh token ไม่ถูกต้องหรือหมดอายุ');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('token ไม่ถูกต้อง');

    const user = await this.users.findById(payload.sub);
    if (!user?.active) throw new UnauthorizedException('ไม่พบผู้ใช้');
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const { secret, accessTtl, refreshTtl } = this.config.get('jwt', { infer: true });
    const base = { sub: user.id, email: user.email };

    // TTL มาจาก env เป็น string ('15m', '7d') — jsonwebtoken ใช้ template literal type ของ ms
    const ttl = (value: string) => value as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ ...base, type: 'access' }, { secret, expiresIn: ttl(accessTtl) }),
      this.jwt.signAsync({ ...base, type: 'refresh' }, { secret, expiresIn: ttl(refreshTtl) }),
    ]);

    return { accessToken, refreshToken, user: toProfile(user) };
  }
}
