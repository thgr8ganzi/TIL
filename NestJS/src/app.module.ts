import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ApiController} from './api/api.controller';
import {UsersModule} from './users/users.module';
import {BaseService} from "./base-service";
import {ServiceA} from "./service-A";
import {ServiceB} from "./service-B";
import { EmailModule } from './email/email.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import * as process from "process";
import emailConfig from "./config/emailConfig";
import {validationSchema} from "./config/validationSchema";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
  controllers: [ApiController, AppController],
  providers: [AppService, BaseService, ServiceA, ServiceB, ConfigService],
  imports: [
      UsersModule,
      ConfigModule.forRoot({
        envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
        load: [emailConfig],
        isGlobal: true,
        validationSchema,
      }),
      TypeOrmModule.forRoot({ // 1
          type: 'mysql', // 2
          host: process.env.DATABASE_HOST, // 3
          port: 3306, // 4
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: 'test',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
          migrationsRun: false, // 2
          migrations: [__dirname + '/**/migrations/*.js'], // 3
          migrationsTableName: 'migrations', // 4
      }),
  ],
})
export class AppModule {}
