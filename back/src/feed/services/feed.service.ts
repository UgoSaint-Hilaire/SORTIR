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

    const total = await this.eventModel.countDocuments(filter);

    // Si aucun événement ne correspond aux genres préférés
    const noResultsReason = total === 0 ? "no_matching_genres" : null;

    // Utiliser $sample pour randomiser les événements comme dans getPublicFeed
    const sampleSize = Math.min(150, total);
    let events = [];

    if (sampleSize > 0) {
      const pipeline = [{ $match: filter }, { $sample: { size: sampleSize } }];
      events = await this.eventModel.aggregate(pipeline).exec();
    }

    return {
      events,
      pagination: {
        total: events.length,
        page: 1,
        limit: events.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
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

    if (query.segments && query.segments.length > 0) {
      filter.segment = { $in: query.segments };
    }

    if (query.genres && query.genres.length > 0) {
      filter.genre = { $in: query.genres };
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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const matchFilter = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
      status: { $ne: "cancelled" },
    };

    const actualTotal = await this.eventModel.countDocuments(matchFilter);

    // Toujours récupérer 150 événements (ou le max dispo)
    const sampleSize = Math.min(150, actualTotal);

    let events = [];

    if (sampleSize > 0) {
      const pipeline = [{ $match: matchFilter }, { $sample: { size: sampleSize } }];

      events = await this.eventModel.aggregate(pipeline).exec();
    }

    return {
      events,
      pagination: {
        total: events.length,
        page: 1,
        limit: events.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async getGenreCounts(): Promise<{ [genre: string]: number }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDateString = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeString = `${hours}:${minutes}:00`;

    const matchFilter = {
      $or: [
        { "date.localDate": { $gt: currentDateString } },
        {
          "date.localDate": currentDateString,
          "date.localTime": { $gte: currentTimeString },
        },
      ],
      status: { $ne: "cancelled" },
      genre: { $exists: true, $ne: null },
    };

    const pipeline = [
      { $match: matchFilter },
      { 
        $group: {
          _id: "$genre",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          genre: "$_id",
          count: 1
        }
      }
    ];

    const results = await this.eventModel.aggregate(pipeline).exec();
    
    const genreCounts: { [genre: string]: number } = {};
    results.forEach(result => {
      genreCounts[result.genre] = result.count;
    });

    return genreCounts;
  }
}
