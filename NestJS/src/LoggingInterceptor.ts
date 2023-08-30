import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {Observable, tap} from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor{ // 1
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> { // 2
        console.log('....Before') // 3
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`After...${Date.now() - now}ms`)) // 4
            )
    }
}