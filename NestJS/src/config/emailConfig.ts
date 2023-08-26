import {registerAs} from "@nestjs/config";
import * as process from "process";

export default registerAs('email', () => ({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_AUTH_USER,
        pass: process.env.EMAIL_AUTH_PASSWORD,
    },
    baseUrl: process.env.EMAIL_BASE_URL,
}));