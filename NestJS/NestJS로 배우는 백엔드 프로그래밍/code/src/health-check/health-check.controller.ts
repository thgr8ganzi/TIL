import {Controller, Get} from '@nestjs/common';
import {HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator} from "@nestjs/terminus";
import {DogHealthIndicator} from "./dog.health";

@Controller('health-check')
export class HealthCheckController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private db: TypeOrmHealthIndicator,
        private dogHealthIndicator: DogHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // () => this.http.pingCheck('nestjs-docs', 'https://www.naver.com/'),
            () => this.db.pingCheck('database'),
            // () => this.dogHealthIndicator.isHealthy('dog')
        ]);
    }
}
