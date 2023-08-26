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

@Module({
  controllers: [ApiController, AppController],
  providers: [AppService, BaseService, ServiceA, ServiceB, ConfigService],
  imports: [
      UsersModule,
      ConfigModule.forRoot({
        envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`], // 1
        load: [emailConfig], // 2
        isGlobal: true, // 3
        validationSchema, // 4
      }),
  ],
})
export class AppModule {}
