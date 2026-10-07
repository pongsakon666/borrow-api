import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { UserProfile } from '@/modules/users/user.entity';
import { AuthService, TokenPair } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './public.decorator';

const REFRESH_COOKIE = 'refresh_token';

/**
 * จำกัดจำนวนครั้งที่ login ได้ต่อนาที (กัน brute force)
 * prod ควรอยู่ราว 5-10 · dev/E2E ตั้งสูงกว่าได้ด้วย AUTH_THROTTLE_LIMIT เพราะรันเทสต์ซ้ำบ่อย
 */
const LOGIN_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 10);

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: LOGIN_LIMIT, ttl: 60_000 } })
  @ApiOperation({ summary: 'เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.login(dto.email, dto.password), res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'ขอ access token ใหม่จาก refresh token (httpOnly cookie)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    return this.respond(await this.auth.refresh(token), res);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ออกจากระบบ — ลบ refresh cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ข้อมูลผู้ใช้ที่ล็อกอินอยู่' })
  me(@CurrentUser() user: UserProfile): UserProfile {
    return user;
  }

  /** ส่ง accessToken ใน body · refreshToken เป็น httpOnly cookie (README §8.4) */
  private respond({ accessToken, refreshToken, user }: TokenPair, res: Response) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken, user } satisfies LoginResponseDto;
  }
}
