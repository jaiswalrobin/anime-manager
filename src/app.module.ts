import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // or 'postgres', 'sqlite', etc.
      host: 'localhost',
      port: 3306, // change to your DB port if necessary
      username: 'root', // your DB username
      password: '', // your DB password
      database: 'animeBackend', // your database name
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // set to false in production
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
