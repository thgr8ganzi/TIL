import {forwardRef, Module} from '@nestjs/common';
import { AuthService } from './auth.service';
import {UsersModule} from "../users/users.module";

@Module({
    imports: [],
    controllers: [],
    providers: [AuthService],
    exports: [AuthService]
})
export class AuthModule { }