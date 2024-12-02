import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '.././user.entity';
import { RegisterDto } from './dto/register.dto';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly emailService: EmailService,
    private configService: ConfigService,
  ) {}
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: object;
    sessionExpiry: number;
  }> {
    const { email, password } = loginDto;

    // Find the user by email
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    console.log('user', user);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if the account is locked (after too many failed attempts)
    if (user.failedAttempts >= 5) {
      throw new ForbiddenException(
        'Account is locked. Please try again later or contact support.',
      );
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await this.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failedAttempts on successful login
    await this.resetFailedAttempts(user.id);

    await this.incrementLoginCount(user.id);

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    // Decode the token and get the expiration time in seconds
    const decodedToken = this.jwtService.decode(accessToken) as { exp: number };

    console.log(decodedToken.exp, 'expppeprwpeorowejr');

    // Convert the exp field (in seconds) to milliseconds
    const sessionExpiry = decodedToken.exp * 1000;

    return {
      accessToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user.id,
        emailVerified: user.emailVerified,
      },
      sessionExpiry,
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { firstName, lastName, email, password } = registerDto;

    const salt = await bcrypt.genSalt();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);
    // Save user with hashed password...

    // Generate email verification token and expiry
    const emailVerificationTokenHash = this.jwtService.sign({ email });
    const emailVerificationTokenExpiry = new Date();
    emailVerificationTokenExpiry.setHours(
      emailVerificationTokenExpiry.getHours() + 24,
    );

    // Create a new user entity with the hashed password
    const newUser = this.usersRepository.create({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      emailVerified: false, // Email verification required
      salt,
      emailVerificationTokenHash,
      emailVerificationTokenExpiry,
    });

    try {
      console.log('sendVerificationEmail-chala..');
      const user = await this.usersRepository.save(newUser);
      await this.emailService.sendVerificationEmail(
        this.configService.get<string>('SES_RECEIPIENT_EMAIL'),
        newUser.emailVerificationTokenHash,
      );
      return user;
    } catch (e) {
      // console.log(e);
      throw e;
      // throw new InternalServerErrorException();
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      console.log('email----------------verifying........', token);
      // Decode the token to extract the email
      const { email } = this.jwtService.verify(token);

      // Find the user in the database
      const user = await this.usersRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      console.log(user, 'user......');

      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Update the user's verified status
      user.emailVerified = true;
      await this.usersRepository.save(user);

      console.log(`User with email ${email} has been verified`);
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException('Invalid or expired token');
      }
      if (error instanceof NotFoundException) {
        throw error; // already handled by NestJS
      }
      throw new InternalServerErrorException(
        'An error occurred while verifying the email',
      );
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a reset token and expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;

    try {
      await this.usersRepository.save(user);
      // return user;
    } catch (error) {
      if (error.code === '23505') {
        // 23505 is the error code for unique violation in PostgreSQL
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }

    try {
      console.log('forgot-password-chala..', user.email);
      // Send the reset token via email (pseudo-code)
      await this.emailService.sendForgotPasswordEmail(
        this.configService.get<string>('SES_RECEIPIENT_EMAIL'),
        resetToken,
      );
    } catch (e) {
      // console.log(e);
      throw e;
      // throw new InternalServerErrorException();
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { resetToken, newPassword } = resetPasswordDto;
    const user = await this.usersRepository.findOne({
      where: { resetToken, resetTokenExpiry: MoreThan(new Date()) },
    });

    console.log('user', user);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.passwordHash = hashedPassword;
    user.resetToken = null; // Clear the reset token
    user.resetTokenExpiry = null; // Clear the reset token expiry

    await this.usersRepository.save(user);
  }

  private async incrementLoginCount(userId: string): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ loginCount: () => 'loginCount + 1' })
      .where('id = :id', { id: userId })
      .execute();
  }

  private async incrementFailedAttempts(userId: string): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ failedAttempts: () => 'failedAttempts + 1' })
      .where('id = :id', { id: userId })
      .execute();
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ failedAttempts: 0 })
      .where('id = :id', { id: userId })
      .execute();
  }
}
