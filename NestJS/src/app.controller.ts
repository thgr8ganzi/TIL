import {Controller, DefaultValuePipe, Get, HttpStatus, Param, ParseIntPipe, Query, UseGuards} from '@nestjs/common';
import { AppService } from './app.service';
import { ServiceB } from './service-B';
import {ConfigService} from "@nestjs/config";
import {ValidationPipe} from "./pipe/validation.pipe";
import {AuthGuard} from "./auth.guard";

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  constructor(private readonly serviceB: ServiceB,
              private readonly configService: ConfigService) {}

  @UseGuards(AuthGuard)
  @Get()
  getHello():string{
    return 'hello';
  }

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
  @Get('/page')
  findAll(
      @Query('offset', new DefaultValuePipe(0), ParseIntPipe)offset: number,
      @Query('limit', new DefaultValuePipe(10), ParseIntPipe)limit:number
  ){
    console.log(offset, limit)
  }
}
