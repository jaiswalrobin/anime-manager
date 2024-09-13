import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '.././user.entity';
import { AuthController } from '.././auth/auth.controller';
import { UserService } from '.././user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [UserService],
})
export class UserModule {}
