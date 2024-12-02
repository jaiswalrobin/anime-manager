import {
  Controller,
  Post,
  Body,
  ConflictException,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async signup(@Body() registerDto: RegisterDto) {
    try {
      console.log('controller-chala...');
      await this.authService.register(registerDto);
      return {
        status: 'success',
        message: 'User registered successfully. Please verify your email.',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Email already in use');
      }
      throw error; // Propagate other errors
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    console.log(result, 'res');
    res.cookie('access-token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // domain: this.configService.get<string>('CORS_ALLOWED_ORIGINS'),
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.status(HttpStatus.OK).json({
      message: 'Login successfull',
      user: result.user,
      sessionExpiry: result.sessionExpiry,
    });
  }

  // Logout route to clear the access-token cookie
  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Res() res: Response) {
    // Clear the access-token cookie
    res.clearCookie('access-token', {
      httpOnly: true, // Ensures the cookie is HttpOnly
      secure: process.env.NODE_ENV === 'production', // Set Secure flag for HTTPS
      sameSite: 'lax',
      path: '/', // Cookie should be available throughout the app
    });

    // Respond with a success message
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Logged out successfully' });
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({ status: 200, description: 'Password reset link sent.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset a user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify a user email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Email verified successfully' });
  }
}
