// src/modules/auth/dto/request-password-reset.dto.ts
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

// src/modules/auth/dto/reset-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string; // format: id.rawToken

  @IsString()
  @MinLength(6)
  newPassword: string;
}
