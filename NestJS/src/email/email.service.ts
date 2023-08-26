import Mail = require('nodemailer/lib/mailer');
import * as nodemailer from 'nodemailer';

import {Inject, Injectable} from '@nestjs/common';
import emailConfig from "../config/emailConfig";
import {ConfigType} from "@nestjs/config";

interface EmailOptions { // 1
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private transporter: Mail;

    constructor(
        @Inject(emailConfig.KEY) private config: ConfigType<typeof emailConfig> // 1
    ) {
        this.transporter = nodemailer.createTransport({ // 2
            service: config.service, // 2
            auth: {
                user: config.auth.user, // 2
                pass: config.auth.pass, // 2
            }
        });
    }

    async sendMemberJoinVerification(emailAddress: string, signupVerifyToken: string) {
        const baseUrl = this.config.baseUrl; // 2

        const url = `${baseUrl}/users/email-verify?signupVerifyToken=${signupVerifyToken}`;

        const mailOptions: EmailOptions = {
            to: emailAddress,
            subject: '가입 인증 메일',
            html: `
        가입확인 버튼를 누르시면 가입 인증이 완료됩니다.<br/>
        <form action="${url}" method="POST">
          <button>가입확인</button>
        </form>
      `
        }

        return await this.transporter.sendMail(mailOptions); // 5
    }
}