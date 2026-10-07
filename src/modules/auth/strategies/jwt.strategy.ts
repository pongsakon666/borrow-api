import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '@/shared/config/configuration';
import { UsersService } from '@/modules/users/users.service';
import { toProfile, UserProfile } from '@/modules/users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.secret', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<UserProfile> {
    if (payload.type !== 'access') throw new UnauthorizedException('token ไม่ถูกต้อง');
    const user = await this.users.findById(payload.sub);
    if (!user?.active) throw new UnauthorizedException('ไม่พบผู้ใช้ หรือถูกปิดการใช้งาน');
    return toProfile(user);
  }
}
