import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Event, EventDocument } from "../../events/schemas/event.schema";
import { UsersService } from "../../users/services/users.service";
import { GetFeedDto } from "../dto/get-feed.dto";
import { FeedResponseDto } from "../dto/feed-response.dto";

// @TODO : REFACTO POSSIBLE DANS CE FICHIER
// @TODO : Ajouter la géolocalisation pour rendre ces méthodes vraiment pertinentes
// @TODO : Merge getCustomFeed et getDiscoveryFeed

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private usersService: UsersService
  ) {}

  async getCustomFeed(userId: number, query: GetFeedDto): Promise<FeedResponseDto> {
    const userPreferences = await this.usersService.getUserPreferences(userId);

    if (!userPreferences || userPreferences.length === 0) {
      const result = await this.getAllEventsFeed(query);
      return {
        ...result,
        noResultsReason: "no_preferences",
      };
    }

    const preferredGenres = userPreferences.map((pref) => pref.classificationName);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Utilise la date ET l'heure locale cette fois
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const filter: any = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
      genre: { $in: preferredGenres },
      status: { $ne: "cancelled" },
    };

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ "date.localDate": 1, "date.localTime": 1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(filter),
    ]);

    // Si aucun événement ne correspond aux genres préférés
    const noResultsReason = total === 0 ? "no_matching_genres" : null;

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      noResultsReason,
    };
  }

  async getAllEventsFeed(query: GetFeedDto): Promise<FeedResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Utiliser la date et l'heure locales
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const dateFilter = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
    };

    const filter: any = {
      ...dateFilter,
      status: { $ne: "cancelled" },
    };

    if (query.segment) {
      filter.segment = query.segment;
    }

    if (query.genre) {
      filter.genre = query.genre;
    }

    // Note: Si les deux sont fournis, alors ça créera un AND
    // Utile pour les recherches bien spécifiques

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ "date.localDate": 1, "date.localTime": 1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(filter),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  //Pas utilisé pour le moment
  async getDiscoveryFeed(userId: number, query: GetFeedDto): Promise<FeedResponseDto> {
    const userPreferences = await this.usersService.getUserPreferences(userId);

    const preferredGenres = userPreferences.map((pref) => pref.classificationName);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const filter: any = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
      status: { $ne: "cancelled" },
    };

    if (preferredGenres.length > 0) {
      filter.genre = { $nin: preferredGenres };
    }

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ "date.localDate": 1, "date.localTime": 1 }).skip(skip).limit(limit).exec(),
      this.eventModel.countDocuments(filter),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getPublicFeed(query: GetFeedDto): Promise<FeedResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const skip = (page - 1) * limit;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const dateFilter = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
    };

    const baseFilter = {
      ...dateFilter,
      status: { $ne: "cancelled" },
    };

    const mainSegments = ["Sports", "Musique", "Arts & Théâtre"];
    const eventsPerSegment = Math.floor(limit / mainSegments.length);
    const remainder = limit % mainSegments.length;

    let allEvents = [];

    for (let i = 0; i < mainSegments.length; i++) {
      const segment = mainSegments[i];
      const segmentLimit = eventsPerSegment + (i < remainder ? 1 : 0);

      const segmentEvents = await this.eventModel
        .find({
          ...baseFilter,
          segment: segment,
        })
        .sort({ syncedAt: -1, "date.localDate": 1, "date.localTime": 1 }) // Récents en premier, puis par date
        .limit(segmentLimit)
        .exec();

      allEvents = [...allEvents, ...segmentEvents];
    }

    const shuffledEvents = this.shuffleArray(allEvents);

    const paginatedEvents = shuffledEvents.slice(skip, skip + limit);

    const total = await this.eventModel.countDocuments(baseFilter);

    return {
      events: paginatedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
