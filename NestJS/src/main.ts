import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {logger3} from "./logger/logger3.middleware";
import {AuthGuard} from "./auth.guard";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({transform:true}))
  app.use(logger3);
  app.useGlobalGuards(new AuthGuard()) // 1
  await app.listen(3000);
}
bootstrap();
