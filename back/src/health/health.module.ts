import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ScheduledHealthService } from '../monitoring/scheduled-health.service';

@Module({
  imports: [
    TerminusModule,
    MonitoringModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, ScheduledHealthService],
  exports: [HealthService],
})
export class HealthModule {}
