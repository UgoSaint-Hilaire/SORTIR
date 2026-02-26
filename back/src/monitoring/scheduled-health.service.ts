import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from '../health/health.service';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class ScheduledHealthService {
  private readonly logger = new Logger(ScheduledHealthService.name);

  constructor(
    private readonly healthService: HealthService,
    private readonly monitoringService: MonitoringService,
  ) {}

  // Vérification automatique toutes les 5 minutes
  @Cron('0 */5 * * * *')
  async runHealthCheck() {
    this.logger.log('Vérification automatique de disponibilité...');

    try {
      const healthStatus = await this.healthService.getHealthStatus();
      await this.monitoringService.checkHealthAndAlert(healthStatus);

      const status = healthStatus.status === 'ok' ? 'OK' : 'ERREUR';
      this.logger.log(
        `Health check ${status} — temps de réponse: ${healthStatus.responseTime}ms`,
      );
    } catch (error) {
      this.logger.error(`Échec du health check automatique: ${error.message}`);
      await this.monitoringService.sendAlert(
        'critical',
        'Health check automatique en échec',
        `Le health check planifié a échoué avec l'erreur: ${error.message}`,
        { error: error.message, timestamp: new Date().toISOString() },
      );
    }
  }
}
