import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type EventDocument = Event & Document;

@Schema({ _id: false })
export class EventImage {
  @Prop()
  url: string;

  @Prop()
  width: number;

  @Prop()
  height: number;

  @Prop()
  ratio?: string;
}

@Schema({ _id: false })
export class EventDate {
  @Prop()
  localDate: string; // Format : YYYY-MM-DD

  @Prop()
  localTime?: string; // Format : HH:MM:SS

  @Prop()
  dateTime?: string;
}

@Schema({ _id: false })
export class EventVenue {
  @Prop()
  id?: string;

  @Prop()
  name: string;

  @Prop()
  type?: string;

  @Prop()
  url?: string;

  @Prop()
  locale?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;

  @Prop()
  countryCode?: string;

  @Prop()
  address?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop({ type: [EventImage] })
  images?: EventImage[];
}

@Schema({ _id: false })
export class PriceRange {
  @Prop()
  min?: number;

  @Prop()
  max?: number;

  @Prop()
  currency?: string;
}

@Schema({ _id: false })
export class EventSales {
  @Prop({ type: Object })
  public?: any;

  @Prop({ type: Object })
  presales?: any;
}

@Schema({
  timestamps: false,
  collection: "events",
})
export class Event {
  @Prop({ required: true, unique: true })
  ticketmasterId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: [EventImage] })
  images?: EventImage[]; // Images avec les dimensions suivantes  : 1024x576, 2048x1152, 640x427

  @Prop({ type: EventDate, required: true })
  date: EventDate;

  @Prop({ type: EventVenue })
  venue?: EventVenue;

  @Prop()
  segment: string; // Peut etre : "Music", "Sports" ou "Arts & Theatre"

  @Prop()
  genre?: string; // Peut etre : "Rock", "Football", "Théâtre", etc.

  @Prop()
  subGenre?: string;

  @Prop({ type: PriceRange })
  priceRange?: PriceRange;

  @Prop({ type: EventSales })
  sales?: EventSales;

  @Prop()
  status?: string; // Peut etre : "onsale", "offsale", "cancelled", etc.

  @Prop({
    default: () =>
      new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
  })
  syncedAt: string;

  @Prop({
    default: () =>
      new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
  })
  createdAt: string;

  @Prop({
    default: () =>
      new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
  })
  updatedAt: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ segment: 1 });
EventSchema.index({ genre: 1 });
EventSchema.index({ "date.localDate": 1 });
EventSchema.index({ "venue.city": 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ syncedAt: 1 });
