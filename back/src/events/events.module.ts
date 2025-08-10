import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsController } from "./controllers/events.controller";
import { TicketmasterService } from "./services/ticketmaster.service";
import { EventsService } from "./services/events.service";
import { Event, EventSchema } from "./schemas/event.schema";

@Module({
  imports: [
    // Configuration MongoDB pour les événements
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  controllers: [EventsController],
  providers: [TicketmasterService, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
