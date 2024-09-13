// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class UserService {}
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
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

import { LoginDto } from './dto/login.dto';

import * as jwt from 'jsonwebtoken'; // Install this package
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    // Find the user by email
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    console.log('user', user);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    //TODO: issue after first login then wrong password then can't login

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await this.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failedAttempts on successful login
    await this.resetFailedAttempts(user.id);

    await this.incrementLoginCount(user.id);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    const payload = { email: user.email, sub: user.id };
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: '1h',
    });

    return { accessToken };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { firstName, lastName, email, password } = registerDto;

    // Check if the email already exists
    // console.log(email, 'email');
    // //====== not working ==============
    // const existingUser = await this.usersRepository.findOne({
    //   where: { email },
    // });
    // console.log(existingUser, 'existingUser...');
    // if (existingUser) {
    //   throw new ConflictException('Email already in use');
    // }
    //================================

    const salt = await bcrypt.genSalt();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);
    // Save user with hashed password...

    // Create a new user entity with the hashed password
    const newUser = this.usersRepository.create({
      firstName,
      lastName,
      email,
      passwordHash: hashedPassword,
      emailVerified: false, // Email verification required
      salt,
      // will be generated when required
      //   emailVerificationTokenHash: this.generateVerificationToken(),
      //   emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Save the user
    // return await this.usersRepository.save(newUser);
    try {
      return await this.usersRepository.save(newUser);
    } catch (e) {
      // console.log(e);
      throw e;
      // throw new InternalServerErrorException();
    }

    // Send verification email
    // await this.sendVerificationEmail(
    //   newUser.email,
    //   newUser.emailVerificationTokenHash,
    // );
    // return hashedPassword;
    // return newUser;
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

    // Send the reset token via email (pseudo-code)
    // await this.emailService.sendResetPasswordEmail(user.email, resetToken);
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

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex'); // Generate a secure random token
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

  //   private async sendVerificationEmail(email: string, token: string) {
  //     // Implement email sending logic here
  //   }
}
