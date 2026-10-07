import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** ยกเว้น route นี้จาก JwtAuthGuard (เช่น login / refresh) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
