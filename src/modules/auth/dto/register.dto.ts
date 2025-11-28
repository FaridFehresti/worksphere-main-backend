import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  // NEW: optional username/handle, matches your extended User schema
  @IsOptional()
  @IsString()
  username?: string;

  // NEW: optional timezone (fallback handled in service)
  @IsOptional()
  @IsString()
  timezone?: string;
}
