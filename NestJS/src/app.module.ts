import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ApiController} from './api/api.controller';
import {UsersModule} from './users/users.module';
import {BaseService} from "./base-service";
import {ServiceA} from "./service-A";
import {ServiceB} from "./service-B";
import {EmailService} from './eamil/eamil.service';
import {UsersService} from "./users/users.service";

@Module({
  controllers: [ApiController, AppController],
  providers: [AppService, UsersService, BaseService, ServiceA, ServiceB, EmailService],
  imports: [UsersModule],
})
export class AppModule {}
