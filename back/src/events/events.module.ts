import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { EventsController } from "./controllers/events.controller";
import { SchedulerController } from "./controllers/scheduler.controller";
import { TicketmasterService } from "./services/ticketmaster.service";
import { EventsService } from "./services/events.service";
import { SchedulerService } from "./services/scheduler.service";
import { SchedulerLoggerService } from "./services/scheduler-logger.service";
import { Event, EventSchema } from "./schemas/event.schema";

@Module({
  imports: [
    // Configuration MongoDB pour les événements
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    // Module de planification pour les tâches cron
    ScheduleModule.forRoot(),
  ],
  controllers: [EventsController, SchedulerController],
  providers: [
    TicketmasterService, 
    EventsService,
    SchedulerService,
    SchedulerLoggerService
  ],
  exports: [EventsService, TicketmasterService],
})
export class EventsModule {}
