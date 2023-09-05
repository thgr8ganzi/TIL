import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Headers,
    UseGuards,
    Inject,
    InternalServerErrorException, LoggerService, Logger, BadRequestException
} from '@nestjs/common';
import { AuthGuard } from 'NestJS/NestJS로 배우는 백엔드 프로그래밍/code/src/auth.guard';
import { AuthService } from 'NestJS/NestJS로 배우는 백엔드 프로그래밍/code/src/auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UserInfo } from './UserInfo';
import { UsersService } from './users.service';
import {WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER} from "nest-winston";
import {Logger as WinstonLogger} from "winston";
import {CommandBus, QueryBus} from "@nestjs/cqrs";
import {CreateUserCommand} from "./command/create-user.command";
import {GetUserInfoQuery} from "./query/get-user-info.query";

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        @Inject(Logger)private readonly logger:LoggerService,
        private commandBus: CommandBus,
        private queryBus: QueryBus,
    ) { }


    @Post()
    async createUser(@Body() dto: CreateUserDto): Promise<void> {
        const { name, email, password } = dto;
        const command = new CreateUserCommand(name, email, password);
        return  this.commandBus.execute(command)
        // this.printWinstonLog(dto);
        // await this.usersService.createUser(name, email, password);
    }

    @Post('/email-verify')
    async verifyEmail(@Query() dto: VerifyEmailDto): Promise<string> {
        const { signupVerifyToken } = dto;
        return await this.usersService.verifyEmail(signupVerifyToken);
    }

    @Post('/login')
    async login(@Body() dto: UserLoginDto): Promise<string> {
        const { email, password } = dto;
        return await this.usersService.login(email, password);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getUserInfo(@Headers() headers: any, @Param('id') userId: string): Promise<UserInfo> {
        const getUserInfoQuery = new GetUserInfoQuery(userId);

        return this.queryBus.execute(getUserInfoQuery)
        // return this.usersService.getUserInfo(userId);
    }

    private printWinstonLog(dto: CreateUserDto) {
        try {

        } catch (e) {
            this.logger.error('error: ' + JSON.stringify(dto), e.stack);
        }
        this.logger.warn('warn: ' + JSON.stringify(dto));
        this.logger.log('log: ' + JSON.stringify(dto));
        this.logger.verbose('verbose: ' + JSON.stringify(dto));
        this.logger.debug('debug: ' + JSON.stringify(dto));
    }
}
