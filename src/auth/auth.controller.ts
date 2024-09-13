import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from '../user/dto/register.dto';
import { LoginDto } from 'src/user/dto/login.dto';
import { ForgotPasswordDto } from 'src/user/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/user/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() registerDto: RegisterDto) {
    const user = await this.userService.register(registerDto);
    return {
      user,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.userService.login(loginDto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    await this.userService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.userService.resetPassword(resetPasswordDto);
  }
}
