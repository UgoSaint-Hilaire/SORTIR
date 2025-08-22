import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/typeorm";
import { InjectConnection as InjectMongoConnection } from "@nestjs/mongoose";
import { Connection } from "typeorm";
import { Connection as MongoConnection } from "mongoose";
import { MonitoringService } from "../monitoring/monitoring.service";

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(
    @InjectConnection() private readonly postgresConnection: Connection,
    @InjectMongoConnection() private readonly mongoConnection: MongoConnection,
    private readonly monitoringService: MonitoringService
  ) {}

  async getHealthStatus() {
    const startTime = Date.now();

    try {
      const [postgresStatus, mongoStatus] = await Promise.all([this.checkPostgresHealth(), this.checkMongoHealth()]);

      const responseTime = Date.now() - startTime;
      const uptime = Date.now() - this.startTime;

      const status = postgresStatus.status === "ok" && mongoStatus.status === "ok" ? "ok" : "error";

      const healthStatus = {
        status,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        responseTime,
        services: {
          postgres: postgresStatus,
          mongodb: mongoStatus,
        },
      };

      // Vérification et envoi d'alertes si nécessaire
      await this.monitoringService.checkHealthAndAlert(healthStatus);

      return healthStatus;
    } catch (error) {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async checkPostgresHealth() {
    try {
      await this.postgresConnection.query("SELECT 1");
      return { status: "ok", message: "PostgreSQL connected" };
    } catch (error) {
      return { status: "error", message: `PostgreSQL error: ${error.message}` };
    }
  }

  private async checkMongoHealth() {
    try {
      await this.mongoConnection.db.admin().ping();
      return { status: "ok", message: "MongoDB connected" };
    } catch (error) {
      return { status: "error", message: `MongoDB error: ${error.message}` };
    }
  }
}
