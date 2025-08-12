import { Module } from "@nestjs/common";
import { FeedController, FeedPublicController } from "./controllers/feed.controller";
import { FeedService } from "./services/feed.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Event, EventSchema } from "../events/schemas/event.schema";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]), UsersModule],
  controllers: [FeedController, FeedPublicController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
