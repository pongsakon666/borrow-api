import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @ApiProperty({ example: 'Passw0rd!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร' })
  password: string;
}
