import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnprocessableEntityException
} from '@nestjs/common';
import * as uuid from 'uuid'
import {UserInfo} from "./UserInfo";
import {EmailService} from "../email/email.service";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "./entity/user.entity";
import {DataSource, Repository} from "typeorm";
import {ulid} from "ulid";
import {AuthService} from "../auth/auth.service";

@Injectable()
export class UsersService {
    constructor(
        private emailService:EmailService,
        @InjectRepository(UserEntity)private usersRepository:Repository<UserEntity>,
        private dataSource:DataSource,
        private authService:AuthService
    ) {}

    async createUser(name: string, email: string, password: string) {
        const userExist = await this.checkUserExists(email);
        const signupVerifyToken = uuid.v1();
        if(userExist){
            throw new UnprocessableEntityException('해당 이메일로는 가입할수 없습니다.')
        }
        // await this.saveUser(name, email, password, signupVerifyToken);
        // await this.saveUserUsingQueryRunner(name, email, password, signupVerifyToken);
        await this.saveUserUsingTransaction(name, email, password, signupVerifyToken);
        await this.sendMemberJoinEmail(email, signupVerifyToken);
    }

    private async saveUserUsingTransaction(name: string, email: string, password: string, signupVerifyToken: string) {
        await this.dataSource.transaction(async manager => {
            const user = new UserEntity();
            user.id = ulid();
            user.name = name;
            user.email = email;
            user.password = password;
            user.signupVerifyToken = signupVerifyToken;

            await manager.save(user);

            // throw new InternalServerErrorException();
        })
    }
    private async saveUserUsingQueryRunner(name: string, email: string, password: string, signupVerifyToken: string) {
        const queryRunner = this.dataSource.createQueryRunner(); // 1
        await queryRunner.connect(); // 2
        await queryRunner.startTransaction(); // 2
        try {
            const user = new UserEntity();
            user.id = ulid();
            user.name = name;
            user.email = email;
            user.password = password;
            user.signupVerifyToken = signupVerifyToken;
            await queryRunner.manager.save(user); // 3
            // throw new InternalServerErrorException(); // 일부러 에러를 발생시켜 본다 // 5
            await queryRunner.commitTransaction(); // 4
        } catch (e) {
            await queryRunner.rollbackTransaction(); // 5
        } finally {
            await queryRunner.release(); // 6
        }
    }

    private async checkUserExists(emailAddress: string): Promise<boolean> {
        const user = await this.usersRepository.findOne({
            where: {
                email: emailAddress
            }
        });
        return user !== null;
    }

    private async saveUser(name: string, email: string, password: string, signupVerifyToken: string) {
        const user = new UserEntity(); // 1
        user.id = ulid(); // 2
        user.name = name; // 2
        user.email = email // 2
        user.password = password // 2
        user.signupVerifyToken = signupVerifyToken // 2
        await this.usersRepository.save(user) // 3
    }

    private async sendMemberJoinEmail(email: string, signupVerifyToken: string) { // 3
        await this.emailService.sendMemberJoinVerification(email, signupVerifyToken)
    }

    async verifyEmail(signupVerifyToken: string) {
        const user = await this.usersRepository.findOne({ // 1
            where: { signupVerifyToken}
        });
        if(!user) { // 2
            throw new UnprocessableEntityException('유저가 존재하지 않습니다.')
        }
        return this.authService.login({ // 3
            id: user.id,
            email: user.email,
            name: user.name
        })
    }

    async login(email: string, password: string): Promise<string> {
        const user = await this.usersRepository.findOne({
            where: { email, password }
        });
        if(!user) {
            throw new NotFoundException('유저가 존재하지 않습니다.');
        }
        return this.authService.login({
            id: user.id,
            email: user.email,
            name: user.name
        });
    }

    async getUserInfo(userId: string): Promise<UserInfo> {
        const user = await this.usersRepository.findOne({
           where: { id: userId }
        });
        if(!user) {
            throw new NotFoundException('유저가 존재하지 않습니다.');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    }
}
