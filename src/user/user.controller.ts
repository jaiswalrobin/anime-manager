import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '.././user.entity';
// import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmailVerifiedGuard } from 'src/auth/email-verified.guard';

@Controller('user')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'get user' })
  @ApiResponse({ status: 201, description: 'User created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Get('all-users')
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<object> {
    const user = await this.userService.findOne(id);
    return {
      name: user.firstName + ' ' + user.lastName,
    };
  }

  //   @Post()
  //   create(@Body() registerDto: RegisterDto): Promise<void> {
  //     return this.userService.register(registerDto);
  //   }

  // @Delete(':id')
  // remove(@Param('id') id: string): Promise<void> {
  //   return this.userService.remove(+id);
  // }
}
