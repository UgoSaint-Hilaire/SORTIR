import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MonitoringService {
  private emailTransporter: nodemailer.Transporter;
  private alertEmail: string;

  constructor(private configService: ConfigService) {
    this.alertEmail = this.configService.get('ALERT_EMAIL');
    
    // Configuration SMTP simple (Gmail, Outlook, etc.)
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

  async sendAlert(alertType: 'warning' | 'critical', title: string, message: string, details?: any) {
    if (!this.alertEmail || !this.emailTransporter) {
      console.warn('Email configuration not complete, skipping alert');
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
      console.log(`Alert email sent successfully: ${title}`);
    } catch (error) {
      console.error('Error sending alert email:', error.message);
    }
  }

  async checkHealthAndAlert(healthStatus: any) {
    if (healthStatus.status === 'error') {
      await this.sendAlert(
        'critical',
        'Système SORTIR en panne',
        `Le système SORTIR rencontre des problèmes critiques.`,
        {
          status: healthStatus.status,
          services: healthStatus.services,
          timestamp: healthStatus.timestamp,
          responseTime: `${healthStatus.responseTime}ms`,
        }
      );
    }

    // Vérification temps de réponse
    if (healthStatus.responseTime > 2000) {
      await this.sendAlert(
        'warning',
        'Temps de réponse élevé',
        `Le système SORTIR répond lentement: ${healthStatus.responseTime}ms`,
        {
          responseTime: `${healthStatus.responseTime}ms`,
          threshold: '2000ms',
        }
      );
    }

    // Vérification services individuels
    if (healthStatus.services?.postgres?.status === 'error') {
      await this.sendAlert(
        'critical',
        'Base PostgreSQL déconnectée',
        'La base de données PostgreSQL ne répond plus',
        healthStatus.services.postgres
      );
    }

    if (healthStatus.services?.mongodb?.status === 'error') {
      await this.sendAlert(
        'critical',
        'Base MongoDB déconnectée',
        'La base de données MongoDB ne répond plus',
        healthStatus.services.mongodb
      );
    }
  }
}