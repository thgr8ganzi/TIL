import {Inject, Injectable, UnauthorizedException} from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import {ConfigType} from "@nestjs/config";
import authConfig from "../config/authConfig";
import {string} from "joi";

interface User{
    id: string;
    name: string;
    email: string;
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(authConfig.KEY) private config: ConfigType<typeof authConfig>,
    ) {}
    login(user:User){
        const payload = {...user};
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: '1d',
            audience: 'example.com',
            issuer: 'example.com',
        });
    }

    verify(jwtString: any) {
        try{
            const payload = jwt.verify(jwtString, this.config.jwtSecret) as (jwt.JwtPayload & string) & User;
            const {id, email} = payload;
            return {
                userId: id,
                email,
            }
        }catch (e){
            throw new UnauthorizedException()
        }
    }
}