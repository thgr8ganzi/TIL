import {forwardRef, Logger, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { EmailModule } from 'src/email/email.module';
import { UserEntity } from './entity/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {APP_FILTER} from "@nestjs/core";
import {HttpExceptionFilter} from "../exception/http-exception.filter";
import {CreateUserHandler} from "./command/create-user.handler";
import {UserEventsHandler} from "./event/user-events.handler";
import {CqrsModule} from "@nestjs/cqrs";
import {GetUserInfoQueryHandler} from "./query/get-user-info.handler";

@Module({
    imports: [
        EmailModule,
        TypeOrmModule.forFeature([UserEntity]),
        AuthModule,
        CqrsModule,
    ],
    controllers: [UsersController],
    providers: [UsersService, Logger, CreateUserHandler, UserEventsHandler, GetUserInfoQueryHandler],
})
export class UsersModule { }
