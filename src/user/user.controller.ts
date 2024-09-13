// import { Controller } from '@nestjs/common';

// @Controller('user')
// export class UserController {}
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '.././user.entity';
import { RegisterDto } from './dto/register.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string): Promise<User> {
  //   return this.userService.findOne(+id);
  // }

  //   @Post()
  //   create(@Body() registerDto: RegisterDto): Promise<void> {
  //     return this.userService.register(registerDto);
  //   }

  // @Delete(':id')
  // remove(@Param('id') id: string): Promise<void> {
  //   return this.userService.remove(+id);
  // }
}
