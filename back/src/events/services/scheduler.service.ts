import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TicketmasterService } from "./ticketmaster.service";
import { SchedulerLoggerService } from "./scheduler-logger.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly ticketmasterService: TicketmasterService,
    private readonly schedulerLogger: SchedulerLoggerService
  ) {}

  /**
   * Job qui s'exécute tous les jours à 6h00 et récupère les évents J+60
   */
  @Cron("0 0 6 * * *")
  async handleDailyEventSync() {
    const startTime = Date.now();

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 60);

    this.schedulerLogger.logJobStart(targetDate);

    try {
      const result = await this.ticketmasterService.fetchAllFrenchEvents(1, targetDate);

      const duration = Date.now() - startTime;

      this.schedulerLogger.logJobSuccess(
        result.saveStats.saved,
        result.saveStats.updated,
        result.saveStats.errors,
        duration
      );

      this.logger.log(
        `Daily job completed: ${result.events.length} events processed for ${targetDate.toISOString().split("T")[0]}`
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.schedulerLogger.logJobError(error, duration);

      this.logger.error(`Daily job failed for ${targetDate.toISOString().split("T")[0]}: ${error.message}`);
    }
  }

  async triggerManualSchedule(): Promise<{
    success: boolean;
    message: string;
    targetDate: string;
    stats?: {
      saved: number;
      updated: number;
      errors: number;
      total: number;
    };
  }> {
    const startTime = Date.now();

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 60);

    this.schedulerLogger.log(`Manual sync triggered for date: ${targetDate.toISOString().split("T")[0]}`);
    this.schedulerLogger.logJobStart(targetDate);

    try {
      const result = await this.ticketmasterService.fetchAllFrenchEvents(1, targetDate);

      const duration = Date.now() - startTime;

      this.schedulerLogger.logJobSuccess(
        result.saveStats.saved,
        result.saveStats.updated,
        result.saveStats.errors,
        duration
      );

      return {
        success: true,
        message: `Manual schedule completed successfully in ${(duration / 1000).toFixed(1)}s`,
        targetDate: targetDate.toISOString().split("T")[0],
        stats: {
          saved: result.saveStats.saved,
          updated: result.saveStats.updated,
          errors: result.saveStats.errors,
          total: result.events.length,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.schedulerLogger.logJobError(error, duration);

      return {
        success: false,
        message: `Manual schedule failed :( : ${error.message}`,
        targetDate: targetDate.toISOString().split("T")[0],
      };
    }
  }
}
