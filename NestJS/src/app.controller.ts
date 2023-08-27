import {Controller, DefaultValuePipe, Get, HttpStatus, Param, ParseIntPipe, Query} from '@nestjs/common';
import { AppService } from './app.service';
import { ServiceB } from './service-B';
import {ConfigService} from "@nestjs/config";
import {ValidationPipe} from "./pipe/validation.pipe";

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
  @Get(':id')
  findOne(@Param('id', ValidationPipe)id:number){
    return id
  }
  @Get()
  findAll(
      @Query('offset', new DefaultValuePipe(0), ParseIntPipe)offset: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe)limit:number
  ){
    console.log(offset, limit)
  }
}
