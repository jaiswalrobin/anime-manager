// email-verified.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user/user.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log(user, 'user...');

    // TODO: Can also add isEmailVerified in the JWT itself
    // Get the user from the service to check the emailVerified field
    const foundUser = await this.userService.findOne(user.userId);

    console.log(foundUser, 'foundUser...');

    // Check if the user is email verified
    if (!foundUser.emailVerified) {
      throw new BadRequestException('Please verify your email first.');
    }

    return true;
  }
}
