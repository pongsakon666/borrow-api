import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '@/modules/users/user.entity';

export class UserProfileDto implements UserProfile {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['admin', 'staff', 'user'] }) role: 'admin' | 'staff' | 'user';
}

export class LoginResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ type: UserProfileDto }) user: UserProfileDto;
}
