import {Logger, Module} from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {LoggingInterceptor} from "./LoggingInterceptor";

@Module({
  providers: [
    Logger,
    {provide: APP_INTERCEPTOR, useClass: LoggingInterceptor}
  ],
  exports: [],
})
export class LoggerModule { }