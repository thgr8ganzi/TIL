import { Injectable } from '@nestjs/common';
import * as uuid from 'uuid'
import {UserInfo} from "./UserInfo";
import {EmailService} from "../email/email.service";

@Injectable()
export class UsersService {
    constructor(private emailService:EmailService) {
    }

    async createUser(name: string, email: string, password: string) {
        await this.checkUSerExists(email); // 1
        const signupVerifyToken = uuid.v1();
        await this.saveUser(name, email, password, signupVerifyToken); // 2
        await this.sendMemberJoinEmail(email, signupVerifyToken); // 3
    }

    private async checkUSerExists(email: string) { // 1
        return false; // DB 연동후 구현
    }

    private async saveUser(name: string, email: string, password: string, signupVerifyToken: string) { // 2
        return; // DB 연동후 구현
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
