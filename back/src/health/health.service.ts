import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { MonitoringService } from '../monitoring/monitoring.service';

const TICKETMASTER_PING_URL =
  'https://app.ticketmaster.com/discovery/v2/events.json?size=1&apikey=ping';
const TICKETMASTER_TIMEOUT_MS = 5000;

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly monitoringService: MonitoringService,
  ) {}

  async getHealthStatus() {
    const checkStart = Date.now();

    let result: HealthCheckResult;

    try {
      result = await this.health.check([
        // Sonde 1 : PostgreSQL — BDD principale (auth, users)
        () => this.db.pingCheck('postgres', { timeout: 3000 }),

        // Sonde 2 : MongoDB — BDD événements Ticketmaster
        () => this.mongoose.pingCheck('mongodb', { timeout: 3000 }),

        // Sonde 3 : Mémoire heap — seuil à 300 MB
        () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

        // Sonde 4 : API externe Ticketmaster (disponibilité)
        async () => this.checkTicketmasterHealth(),
      ]);
    } catch (error) {
      // Terminus lève une exception ServiceUnavailableException si un check échoue
      // On récupère le résultat depuis l'exception pour continuer le traitement
      result = error.response as HealthCheckResult;
    }

    const responseTime = Date.now() - checkStart;
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    const healthStatus = {
      status: result?.status ?? 'error',
      timestamp: new Date().toISOString(),
      uptime,
      responseTime,
      details: result?.details ?? {},
      error: result?.error ?? {},
    };

    await this.monitoringService.checkHealthAndAlert(healthStatus);

    return healthStatus;
  }

  private async checkTicketmasterHealth(): Promise<{ ticketmaster: any }> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      TICKETMASTER_TIMEOUT_MS,
    );

    try {
      const response = await fetch(TICKETMASTER_PING_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      // 401 = clé invalide mais API joignable, 200 = OK
      const reachable = response.status < 500;

      return {
        ticketmaster: {
          status: reachable ? 'up' : 'down',
          httpStatus: response.status,
        },
      };
    } catch {
      return {
        ticketmaster: {
          status: 'down',
          message: 'API Ticketmaster injoignable (timeout ou réseau)',
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
