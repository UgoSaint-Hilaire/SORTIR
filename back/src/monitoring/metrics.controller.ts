import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Registry, collectDefaultMetrics, Gauge } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

// Gauge uptime applicatif (en secondes)
const appUptimeGauge = new Gauge({
  name: 'sortir_app_uptime_seconds',
  help: "Temps d'exécution de l'application SORTIR en secondes",
  registers: [registry],
});

// Gauge statut des services (1 = disponible, 0 = indisponible)
export const serviceStatusGauge = new Gauge({
  name: 'sortir_service_up',
  help: 'Disponibilité des services SORTIR (1=OK, 0=KO)',
  labelNames: ['service'],
  registers: [registry],
});

// Initialiser les gauges à 1 (supposé disponible au démarrage)
serviceStatusGauge.set({ service: 'postgres' }, 1);
serviceStatusGauge.set({ service: 'mongodb' }, 1);
serviceStatusGauge.set({ service: 'ticketmaster' }, 1);

const startTime = Date.now();

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    // Mise à jour de l'uptime avant chaque scrape
    appUptimeGauge.set(Math.floor((Date.now() - startTime) / 1000));

    const metrics = await registry.metrics();
    res.setHeader('Content-Type', registry.contentType);
    res.send(metrics);
  }
}
