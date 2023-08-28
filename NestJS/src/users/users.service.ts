import {Injectable, InternalServerErrorException, UnprocessableEntityException} from '@nestjs/common';
import * as uuid from 'uuid'
import {UserInfo} from "./UserInfo";
import {EmailService} from "../email/email.service";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "./entity/user.entity";
import {DataSource, Repository} from "typeorm";
import {ulid} from "ulid";

@Injectable()
export class UsersService {
    constructor(
        private emailService:EmailService,
        @InjectRepository(UserEntity)private usersRepository:Repository<UserEntity>,
        private dataSource:DataSource // 1
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
        // TODO
        // 1. DB에서 signupVerifyToken으로 회원 가입 처리중인 유저가 있는지 조회하고 없다면 에러 처리
        // 2. 바로 로그인 상태가 되도록 JWT를 발급

        return ''
    }

    async login(email: string, password: string): Promise<string> {
        // TODO
        // 1. email, password를 가진 유저가 존재하는지 DB에서 확인하고 없다면 에러 처리
        // 2. JWT를 발급

        throw new Error('Method not implemented.');
    }

    async getUserInfo(userId: string): Promise<UserInfo> {
        // 1. userId를 가진 유저가 존재하는지 DB에서 확인하고 없다면 에러 처리
        // 2. 조회된 데이터를 UserInfo 타입으로 응답

        throw new Error('Method not implemented.');
    }
}
