import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  Param,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { TicketmasterService } from "../services/ticketmaster.service";
import { EventsService } from "../services/events.service";

/**
 * Contrôleur pour récupérer les événements depuis l'api de Ticketmaster
 */
@Controller("events")
export class EventsController {
  constructor(
    private readonly ticketmasterService: TicketmasterService,
    private readonly eventsService: EventsService
  ) {}

  @Post("sync")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Roles("admin")
  async syncAllEvents(@Body() body: { days?: number }) {
    try {
      const days = body.days || 30;

      if (days < 1 || days > 365) {
        throw new BadRequestException({
          success: false,
          code: 400,
          message: "Days must be minimum 1 and maximum365",
        });
      }

      const result = await this.ticketmasterService.fetchAllFrenchEvents(days);

      return {
        success: true,
        code: 200,
        message: `Events retrieved and added to mongo database - (${days} days)`,
        total: result.events.length,
        saved: result.saveStats.saved,
        updated: result.saveStats.updated,
        errors: result.saveStats.errors,
        events: result.events,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        code: 500,
        message: "Failed to retrieve events",
        error: error.message,
        total: 0,
        saved: 0,
        updated: 0,
        errors: 1,
        events: [],
      });
    }
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getEventsNumber() {
    try {
      const stats = await this.eventsService.getEventsNumber();

      return {
        success: true,
        code: 200,
        message: "Events stats retrieved successfully",
        stats: stats,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        code: 500,
        message: "Failed to retrieve events number",
        error: error.message,
        stats: null,
      });
    }
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getEventById(@Param("id") id: string) {
    try {
      const event = await this.eventsService.findById(id);

      if (!event) {
        throw new NotFoundException({
          success: false,
          code: 404,
          message: `Event with ID ${id} not found`,
          data: null,
        });
      }

      return {
        success: true,
        code: 200,
        message: "Event retrieved successfully",
        data: event,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        code: 500,
        message: "Failed to retrieve event",
        error: error.message,
        data: null,
      });
    }
  }
}
