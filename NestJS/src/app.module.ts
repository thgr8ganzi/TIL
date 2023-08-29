import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import * as process from "process";
import emailConfig from "./config/emailConfig";
import {validationSchema} from "./config/validationSchema";
import {TypeOrmModule} from "@nestjs/typeorm";
import {LoggerMiddleware} from "./logger/logger.middleware";
import {Logger2Middleware} from "./logger/logger2.middleware";
import {UsersController} from "./users/users.controller";
import authConfig from "./config/authConfig";

@Module({
  imports: [
      UsersModule,
      ConfigModule.forRoot({
        envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
        load: [emailConfig, authConfig],
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
  controllers: [],
  providers: [],
})
export class AppModule {}
