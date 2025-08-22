import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly monitoringService: MonitoringService
  ) {}

  @Get()
  async checkHealth() {
    return await this.healthService.getHealthStatus();
  }

  @Get('test-alert')
  async testAlert() {
    await this.monitoringService.sendAlert(
      'warning',
      'Test d\'alerte SORTIR',
      'Ceci est un test du système d\'alerte. Si tu reçois ce message, la configuration email fonctionne !',
      {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test réussi !'
      }
    );
    return { message: 'Email de test envoyé ! Vérifie ta boîte mail.' };
  }

  @Get('simulate-critical')
  async simulateCritical() {
    await this.monitoringService.sendAlert(
      'critical',
      'SIMULATION: Base MongoDB déconnectée',
      'SIMULATION: La base de données MongoDB ne répond plus - Test d\'alerte critique',
      {
        simulation: true,
        service: 'mongodb',
        status: 'error',
        timestamp: new Date().toISOString()
      }
    );
    return { message: 'Alerte CRITIQUE simulée envoyée !' };
  }
}