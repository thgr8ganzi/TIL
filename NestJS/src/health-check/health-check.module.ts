import { Module } from '@nestjs/common';
import {TerminusModule} from "@nestjs/terminus";
import {HttpModule} from "@nestjs/axios";
import {HealthCheckController} from "./health-check.controller";
import {DogHealthIndicator} from "./dog.health";

@Module({
    imports:[
        TerminusModule,
        HttpModule,
    ],
    controllers: [HealthCheckController],
    providers: [DogHealthIndicator]
})
export class HealthCheckModule {}
