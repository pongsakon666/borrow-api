import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserProfile } from '@/modules/users/user.entity';

/** ดึง user ที่ผ่าน JwtAuthGuard มาแล้ว: `@CurrentUser() user: UserProfile` */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user: UserProfile }>();
  return request.user;
});
