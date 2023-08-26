import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServiceB } from './service-B';
import {ConfigService} from "@nestjs/config";

@Controller()
export class AppController {
  constructor(private readonly serviceB: ServiceB,
              private readonly configService: ConfigService) {}

  @Get('/serviceB')
  getHelloC(): string {
    return this.serviceB.getHello();
  }
  @Get('/db-host-from-config')
  getDatabaseHostFromConfigService(): string {
    return this.configService.get('DATABASE_HOST');
  }

}
