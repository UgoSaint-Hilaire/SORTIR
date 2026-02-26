import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Registry, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

// ── Disponibilité ──────────────────────────────────────────────────────────

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

serviceStatusGauge.set({ service: 'postgres' }, 1);
serviceStatusGauge.set({ service: 'mongodb' }, 1);
serviceStatusGauge.set({ service: 'ticketmaster' }, 1);

// ── Qualité & Performance HTTP ─────────────────────────────────────────────

// Compteur total de requêtes HTTP reçues
export const httpRequestsTotal = new Counter({
  name: 'sortir_http_requests_total',
  help: 'Nombre total de requêtes HTTP reçues par SORTIR',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// Histogramme des temps de réponse par endpoint (en secondes)
export const httpRequestDuration = new Histogram({
  name: 'sortir_http_request_duration_seconds',
  help: 'Temps de réponse des requêtes HTTP par endpoint',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets adaptés à une API REST : de 10ms à 10s
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

// Compteur d'erreurs HTTP (4xx + 5xx)
export const httpErrorsTotal = new Counter({
  name: 'sortir_http_errors_total',
  help: 'Nombre total de réponses HTTP en erreur (4xx et 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// ── Initialisation à zéro ──────────────────────────────────────────────────
// Pré-crée les séries temporelles pour les routes principales de SORTIR,
// so qu'elles apparaissent dans /metrics dès le démarrage (même sans trafic).

const KNOWN_ROUTES: Array<{ method: string; route: string }> = [
  { method: 'GET',    route: '/health' },
  { method: 'GET',    route: '/metrics' },
  { method: 'POST',   route: '/auth/login' },
  { method: 'POST',   route: '/auth/register' },
  { method: 'POST',   route: '/auth/logout' },
  { method: 'GET',    route: '/auth/profile' },
  { method: 'GET',    route: '/feed' },
  { method: 'GET',    route: '/events' },
  { method: 'POST',   route: '/events/sync' },
  { method: 'GET',    route: '/users' },
  { method: 'GET',    route: '/users/:id' },
  { method: 'PUT',    route: '/users/:id' },
  { method: 'DELETE', route: '/users/:id' },
];

const SUCCESS_CODES = ['200', '201'];
const ERROR_CODES   = ['400', '401', '403', '404', '500'];

KNOWN_ROUTES.forEach(({ method, route }) => {
  // Requêtes totales — succès + erreurs
  [...SUCCESS_CODES, ...ERROR_CODES].forEach((status_code) => {
    httpRequestsTotal.labels({ method, route, status_code }).inc(0);
  });

  // Temps de réponse — initialise sur les succès
  SUCCESS_CODES.forEach((status_code) => {
    httpRequestDuration.labels({ method, route, status_code }).observe(0);
  });

  // Erreurs — initialise sur les codes d'erreur courants
  ERROR_CODES.forEach((status_code) => {
    httpErrorsTotal.labels({ method, route, status_code }).inc(0);
  });
});

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
