import {CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor{
    constructor(private logger:Logger) {}
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any>{
        const { method, url, body } = context.getArgByIndex(0); // 1
        this.logger.log(`Request to ${method} ${url}`); // 2
        return next
            .handle()
            .pipe(
                tap(data => this.logger.log(`Response from ${method} ${url} \n response: ${JSON.stringify(data)}`)) // 3
            )
    }
}