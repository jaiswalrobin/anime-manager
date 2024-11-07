import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token' })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @Length(6, 20) // Adjust the length as per your password policy
  @IsNotEmpty()
  newPassword: string;
}
