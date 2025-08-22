import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs";
import * as path from "path";

export interface AuthEvent {
  timestamp: Date;
  event:
    | "login_success"
    | "login_failed"
    | "register_success"
    | "register_failed"
    | "logout"
    | "token_blacklisted"
    | "rate_limit_exceeded";
  email?: string;
  username?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
  reason?: string;
  metadata?: any;
}

@Injectable()
export class AuthLoggerService {
  private readonly logger = new Logger("AuthSecurity");
  private readonly logFilePath: string;

  constructor() {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, "auth-security.log");
  }

  private async writeToFile(event: AuthEvent): Promise<void> {
    const logEntry =
      JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }) + "\n";

    return new Promise((resolve, reject) => {
      fs.appendFile(this.logFilePath, logEntry, (err) => {
        if (err) {
          this.logger.error("Failed to write auth log to file", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private getClientInfo(request: any): { ip: string; userAgent: string } {
    const ip =
      request.ip ||
      request.connection?.remoteAddress ||
      request.headers?.["x-forwarded-for"]?.split(",")[0] ||
      "unknown";
    const userAgent = request.headers?.["user-agent"] || "unknown";
    return { ip, userAgent };
  }

  async logLoginSuccess(email: string, userId: number, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "login_success",
      email,
      userId,
      ip,
      userAgent,
    };

    this.logger.log(`LOGIN SUCCESS: User ${email} (ID: ${userId}) from IP: ${ip}`);
    await this.writeToFile(event);
  }

  async logLoginFailed(email: string, reason: string, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "login_failed",
      email,
      ip,
      userAgent,
      reason,
    };

    this.logger.warn(`LOGIN FAILED: Email ${email} from IP: ${ip} - Reason: ${reason}`);
    await this.writeToFile(event);
  }

  async logRegisterSuccess(username: string, email: string, userId: number, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "register_success",
      username,
      email,
      userId,
      ip,
      userAgent,
    };

    this.logger.log(`REGISTER SUCCESS: User ${username} (${email}, ID: ${userId}) from IP: ${ip}`);
    await this.writeToFile(event);
  }

  async logRegisterFailed(username: string, email: string, reason: string, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "register_failed",
      username,
      email,
      ip,
      userAgent,
      reason,
    };

    this.logger.warn(`REGISTER FAILED: Username ${username} (${email}) from IP: ${ip} - Reason: ${reason}`);
    await this.writeToFile(event);
  }

  async logLogout(userId: number, email: string, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "logout",
      email,
      userId,
      ip,
      userAgent,
    };

    this.logger.log(`LOGOUT: User ${email} (ID: ${userId}) from IP: ${ip}`);
    await this.writeToFile(event);
  }

  async logTokenBlacklisted(userId: number, email: string): Promise<void> {
    const event: AuthEvent = {
      timestamp: new Date(),
      event: "token_blacklisted",
      email,
      userId,
    };

    this.logger.log(`TOKEN BLACKLISTED: User ${email} (ID: ${userId})`);
    await this.writeToFile(event);
  }

  async logRateLimitExceeded(endpoint: string, request?: any): Promise<void> {
    const { ip, userAgent } = request ? this.getClientInfo(request) : { ip: "unknown", userAgent: "unknown" };

    const event: AuthEvent = {
      timestamp: new Date(),
      event: "rate_limit_exceeded",
      ip,
      userAgent,
      metadata: { endpoint },
    };

    this.logger.warn(`RATE LIMIT EXCEEDED: Endpoint ${endpoint} from IP: ${ip}`);
    await this.writeToFile(event);
  }

  async getRecentFailedAttempts(email: string, minutes: number = 15): Promise<number> {
    const logs = await this.readRecentLogs(minutes);
    return logs.filter((log) => log.event === "login_failed" && log.email === email).length;
  }

  private async readRecentLogs(minutes: number): Promise<AuthEvent[]> {
    return new Promise((resolve) => {
      if (!fs.existsSync(this.logFilePath)) {
        resolve([]);
        return;
      }

      fs.readFile(this.logFilePath, "utf8", (err, data) => {
        if (err) {
          this.logger.error("Failed to read auth log file", err);
          resolve([]);
          return;
        }

        const logs: AuthEvent[] = [];
        const lines = data.split("\n").filter((line) => line.trim());
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            if (new Date(log.timestamp) > cutoffTime) {
              logs.push(log);
            }
          } catch (e) {}
        }

        resolve(logs);
      });
    });
  }
}
