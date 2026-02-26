import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { serviceStatusGauge } from './metrics.controller';

const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes entre deux alertes pour un même service

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private emailTransporter: nodemailer.Transporter;
  private alertEmail: string;

  // Cooldown anti-spam : stocke le timestamp du dernier envoi par clé de service
  private lastAlertTimes = new Map<string, number>();

  constructor(private configService: ConfigService) {
    this.alertEmail = this.configService.get('ALERT_EMAIL');

    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private isOnCooldown(serviceKey: string): boolean {
    const lastAlert = this.lastAlertTimes.get(serviceKey);
    if (!lastAlert) return false;
    return Date.now() - lastAlert < ALERT_COOLDOWN_MS;
  }

  private updateCooldown(serviceKey: string): void {
    this.lastAlertTimes.set(serviceKey, Date.now());
  }

  async sendAlert(
    alertType: 'warning' | 'critical',
    title: string,
    message: string,
    details?: any,
    serviceKey?: string,
  ) {
    // Vérification du cooldown si une clé de service est fournie
    if (serviceKey && this.isOnCooldown(serviceKey)) {
      this.logger.warn(
        `[cooldown] Alerte supprimée pour "${serviceKey}" (délai 15 min non écoulé)`,
      );
      return;
    }

    if (!this.alertEmail || !this.emailTransporter) {
      this.logger.warn('Configuration email incomplète, alerte non envoyée');
      return;
    }

    const emoji = alertType === 'critical' ? '🔴' : '🟡';
    const priority = alertType === 'critical' ? 'CRITIQUE' : 'ATTENTION';

    let htmlContent = `
      <h2>${emoji} ${title}</h2>
      <p><strong>Niveau:</strong> ${priority}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Horodatage:</strong> ${new Date().toLocaleString('fr-FR')}</p>
    `;

    if (details) {
      htmlContent += `
        <h3>Détails techniques:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
${JSON.stringify(details, null, 2)}
        </pre>
      `;
    }

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: this.alertEmail,
      subject: `[SORTIR ${priority}] ${title}`,
      html: htmlContent,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      this.logger.log(`Alerte email envoyée: ${title}`);
      if (serviceKey) this.updateCooldown(serviceKey);
    } catch (error) {
      this.logger.error(`Erreur envoi alerte email: ${error.message}`);
    }
  }

  async checkHealthAndAlert(healthStatus: any) {
    // Mise à jour des gauges Prometheus
    const services = healthStatus.details ?? healthStatus.services ?? {};

    const pgStatus =
      services?.postgres?.status === 'up' ||
      services?.postgres?.status === 'ok';
    const mongoStatus =
      services?.mongodb?.status === 'up' ||
      services?.mongodb?.status === 'ok';
    const tmStatus =
      services?.ticketmaster?.status === 'up' ||
      services?.ticketmaster?.status === 'ok';

    serviceStatusGauge.set({ service: 'postgres' }, pgStatus ? 1 : 0);
    serviceStatusGauge.set({ service: 'mongodb' }, mongoStatus ? 1 : 0);
    serviceStatusGauge.set({ service: 'ticketmaster' }, tmStatus ? 1 : 0);

    // Alerte globale système
    if (healthStatus.status === 'error') {
      await this.sendAlert(
        'critical',
        'Système SORTIR en panne',
        'Le système SORTIR rencontre des problèmes critiques.',
        {
          status: healthStatus.status,
          services: services,
          timestamp: healthStatus.timestamp,
          responseTime: `${healthStatus.responseTime}ms`,
        },
        'system_error',
      );
    }

    // Temps de réponse élevé
    if (healthStatus.responseTime > 2000) {
      await this.sendAlert(
        'warning',
        'Temps de réponse élevé',
        `Le système SORTIR répond lentement: ${healthStatus.responseTime}ms`,
        { responseTime: `${healthStatus.responseTime}ms`, threshold: '2000ms' },
        'response_time',
      );
    }

    // PostgreSQL indisponible
    if (!pgStatus && services?.postgres) {
      await this.sendAlert(
        'critical',
        'Base PostgreSQL déconnectée',
        'La base de données PostgreSQL ne répond plus',
        services.postgres,
        'postgres_down',
      );
    }

    // MongoDB indisponible
    if (!mongoStatus && services?.mongodb) {
      await this.sendAlert(
        'critical',
        'Base MongoDB déconnectée',
        'La base de données MongoDB ne répond plus',
        services.mongodb,
        'mongodb_down',
      );
    }

    // API Ticketmaster indisponible
    if (!tmStatus && services?.ticketmaster) {
      await this.sendAlert(
        'warning',
        'API Ticketmaster indisponible',
        "L'API externe Ticketmaster ne répond plus, la synchronisation des événements est suspendue",
        services.ticketmaster,
        'ticketmaster_down',
      );
    }

    // Mémoire heap critique
    const memStatus = services?.memory_heap;
    if (memStatus?.status === 'down') {
      await this.sendAlert(
        'critical',
        'Mémoire heap critique',
        `La consommation mémoire dépasse le seuil de 300 MB`,
        memStatus,
        'memory_heap',
      );
    }
  }
}
