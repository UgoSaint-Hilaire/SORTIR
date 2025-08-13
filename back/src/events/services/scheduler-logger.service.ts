import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class SchedulerLoggerService {
  private readonly logger = new Logger(SchedulerLoggerService.name);
  private readonly logFilePath: string;

  constructor() {
    const logsDir = path.join(process.cwd(), "logs");

    // Créer le dossier logs s'il n'existe pas
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFilePath = path.join(logsDir, "scheduler.log");
  }

  private writeInLogFile(message: string): void {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const logText = `${timestamp} - ${message}\n`;

    try {
      fs.appendFileSync(this.logFilePath, logText, "utf8");
    } catch (error) {
      this.logger.error(`Failed to write in the log file: ${error.message}`);
    }
  }

  logJobStart(targetDate: Date): void {
    const message = `[START] Daily schedule job started for date: ${targetDate.toISOString().split("T")[0]}`;
    this.logger.log(message);
    this.writeInLogFile(message);
  }

  logJobSuccess(saved: number, updated: number, errors: number, duration: number): void {
    const message = `[SUCCESS] Events synced: ${saved} saved, ${updated} updated, ${errors} errors`;
    this.logger.log(message);
    this.writeInLogFile(message);

    const durationMessage = `[END] Job completed in ${(duration / 1000).toFixed(1)}s`;
    this.logger.log(durationMessage);
    this.writeInLogFile(durationMessage);
  }

  logJobError(error: Error, duration: number): void {
    const errorMessage = `[ERROR] ${error.message}`;
    this.logger.error(errorMessage);
    this.writeInLogFile(errorMessage);

    const durationMessage = `[END] Job failed after ${(duration / 1000).toFixed(1)}s`;
    this.logger.error(durationMessage);
    this.writeInLogFile(durationMessage);
  }

  log(message: string): void {
    const formattedMessage = `[INFO] ${message}`;
    this.logger.log(formattedMessage);
    this.writeInLogFile(formattedMessage);
  }

  readLogFile(): string {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return "No logs available yet.";
      }
      return fs.readFileSync(this.logFilePath, "utf8");
    } catch (error) {
      this.logger.error(`Failed to read log file: ${error.message}`);
      return `Error reading log file: ${error.message}`;
    }
  }
}
