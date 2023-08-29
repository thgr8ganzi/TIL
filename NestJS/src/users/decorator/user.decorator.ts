import {createParamDecorator, ExecutionContext} from "@nestjs/common";

export const User = createParamDecorator( // 1
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest(); // 2
        return request.user; // 3
    }
)