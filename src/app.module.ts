import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '/assets'),
      serveRoot: '/assets',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql', // or 'postgres', 'sqlite', etc.
      host: '127.0.0.1',
      port: 3306, // change to your DB port if necessary
      username: 'root', // your DB username
      password: '', // your DB password
      database: 'animeBackend', // your database name
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // set to false in production
      // logging: true,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
