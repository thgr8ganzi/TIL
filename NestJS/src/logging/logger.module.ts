import { Module } from '@nestjs/common';
import {MyLogger} from "./myLogger";

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule { }