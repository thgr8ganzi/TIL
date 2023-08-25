import { Module } from '@nestjs/common';
import {UsersController} from "./users.controller";
import {UsersService} from "./users.service";
import {EmailService} from "../eamil/eamil.service";

@Module({
    imports: [],
    controllers: [UsersController],
    providers: [UsersService, EmailService]
})
export class UsersModule {}
