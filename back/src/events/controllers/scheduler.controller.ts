import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus, Header } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SchedulerService } from "../services/scheduler.service";
import { SchedulerLoggerService } from "../services/scheduler-logger.service";

@Controller("scheduler")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly schedulerLogger: SchedulerLoggerService
  ) {}

  @Post("manual-schedule")
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async triggerManualSchedule() {
    const result = await this.schedulerService.triggerManualSchedule();

    return {
      success: result.success,
      code: result.success ? 200 : 500,
      message: result.message,
      targetDate: result.targetDate,
      stats: result.stats,
    };
  }

  @Get("logs")
  @HttpCode(HttpStatus.OK)
  @Header("Content-Type", "text/plain; charset=utf-8")
  @Roles('admin')
  getSchedulerLogs(): string {
    return this.schedulerLogger.readLogFile();
  }
}
