import { Module } from '@nestjs/common';
import { AuthController } from '.././auth/auth.controller';
import { EmailService } from 'src/email/email.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => {
        console.log(
          configService.get<string>('JWT_SECRET'),
          typeof configService.get<string>('JWT_EXPIRATION_TIME'),
        );
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: +configService.get<string>('JWT_EXPIRATION_TIME'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
