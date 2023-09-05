import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from "process";
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities, WINSTON_MODULE_PROVIDER,
  WinstonModule,
} from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',
          format: winston.format.combine(
              winston.format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike('MyApp', { prettyPrint: true }),
          ),
        }),
      ],
    })
  });
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  await app.listen(3000);
}
bootstrap();
