import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event, EventDocument } from "./schemas/event.schema";

/**
 * Service qui gère les événements dans la base de données MongoDB
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  /**
   * Sauvegarde tous les événements Ticketmaster en base de données
   * Utilise upsert pour éviter les doublons (basé sur ticketmasterId)
   */
  async saveInDBEvents(
    tmEvents: any[],
    segment: string
  ): Promise<{
    saved: number;
    updated: number;
    errors: number;
  }> {
    this.logger.log(`!!! Début sauvegarde de ${tmEvents.length} événements ${segment}...`);

    let savedCount = 0;
    let updatedCount = 0;
    let errorsCount = 0;

    for (const tmEvent of tmEvents) {
      try {
        const mongoFormatEvent = this.transformTicketmasterEventToMongo(tmEvent, segment);

        const existingEvent = await this.eventModel.findOne({
          ticketmasterId: mongoFormatEvent.ticketmasterId,
        });

        if (existingEvent) {
          const currentDate = new Date().toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          await this.eventModel.updateOne(
            { ticketmasterId: mongoFormatEvent.ticketmasterId },
            {
              ...mongoFormatEvent,
              syncedAt: currentDate,
              updatedAt: currentDate,
              createdAt: existingEvent.createdAt,
            }
          );
          updatedCount++;
        } else {
          const newEvent = new this.eventModel(mongoFormatEvent);
          await newEvent.save();
          savedCount++;
        }
      } catch (error) {
        this.logger.error(`!!! Erreur lors de la sauvegarde de l'événement ${tmEvent.id}: ${error.message}`);
        errorsCount++;
      }
    }

    this.logger.log(
      `!!! Sauvegarde terminée: ${savedCount} nouveaux, ${updatedCount} mis à jour et ${errorsCount} erreurs`
    );

    return {
      saved: savedCount,
      updated: updatedCount,
      errors: errorsCount,
    };
  }

  // Transforme un événement Ticketmaster brut au format MongoDB
  private transformTicketmasterEventToMongo(rawEvent: any, segment: string): any {
    const classification = rawEvent.classifications?.[0];
    const venue = rawEvent._embedded?.venues?.[0];

    // On prend que lezs images avec ces dimensions
    const targetDimensions = [
      { width: 1024, height: 576 },
      { width: 2048, height: 1152 },
      { width: 640, height: 427 },
    ];

    const filteredImages =
      rawEvent.images
        ?.filter((img: any) => {
          return targetDimensions.some((dim) => img.width === dim.width && img.height === dim.height);
        })
        .map((img: any) => ({
          url: img.url,
          width: img.width,
          height: img.height,
          ratio: img.ratio,
        })) || [];

    const dateInfo = rawEvent.dates?.start;
    if (!dateInfo) {
      throw new Error(`Événement ${rawEvent.id}: pas de date disponible`);
    }

    const transformedDate = {
      localDate: dateInfo.localDate,
      localTime: dateInfo.localTime,
      dateTime: dateInfo.dateTime,
    };

    // Transforme les données de lavenue
    const transformedVenue = venue
      ? {
          id: venue.id,
          name: venue.name,
          type: venue.type,
          url: venue.url,
          locale: venue.locale,
          city: venue.city?.name,
          country: venue.country?.name,
          countryCode: venue.country?.countryCode,
          address: venue.address?.line1,
          latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
          longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
          images:
            venue.images
              ?.filter((img: any) => {
                return targetDimensions.some((dim) => img.width === dim.width && img.height === dim.height);
              })
              .map((img: any) => ({
                url: img.url,
                width: img.width,
                height: img.height,
                ratio: img.ratio,
              })) || [],
        }
      : undefined;

    // Transformr les prix
    const transformedPriceRange = rawEvent.priceRanges?.[0]
      ? {
          min: rawEvent.priceRanges[0].min,
          max: rawEvent.priceRanges[0].max,
          currency: rawEvent.priceRanges[0].currency,
        }
      : undefined;

    // Transforme les sales
    const transformedSales = rawEvent.sales
      ? {
          public: rawEvent.sales.public,
          presales: rawEvent.sales.presales,
        }
      : undefined;

    return {
      ticketmasterId: rawEvent.id,
      name: rawEvent.name || "Sans nom",
      description: rawEvent.description,
      url: rawEvent.url,
      images: filteredImages,
      date: transformedDate,
      venue: transformedVenue,
      segment: classification?.segment?.name || segment,
      genre: classification?.genre?.name,
      subGenre: classification?.subGenre?.name,
      priceRange: transformedPriceRange,
      sales: transformedSales,
      status: rawEvent.dates?.status?.code,
      syncedAt: new Date().toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }

  /**
   * Récupère le nombre d'événements en base mongo
   */
  async getEventsNumber(): Promise<{
    total: number;
    lastSync: string | null;
  }> {
    const total = await this.eventModel.countDocuments();
    const lastSyncResult = await this.eventModel.findOne({}, { syncedAt: 1 }).sort({ _id: -1 });
    const lastSync = lastSyncResult?.syncedAt || null;

    return {
      total,
      lastSync,
    };
  }
}
