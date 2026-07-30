import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@market.local' })
  @IsEmail()
  public email!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6)
  public password!: string;
}
