import { IsString, Length, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @Length(6, 20) // Adjust the length as per your password policy
  @IsNotEmpty()
  newPassword: string;
}
