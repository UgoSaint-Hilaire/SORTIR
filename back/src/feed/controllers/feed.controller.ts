import { Controller, Get, Query, UseGuards, Request, HttpStatus } from "@nestjs/common";
import { FeedService } from "../services/feed.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Public } from "../../auth/decorators/public.decorator";
import { GetFeedDto } from "../dto/get-feed.dto";

@Controller("feed")
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getPersonalizedFeed(@Request() req, @Query() query: GetFeedDto) {
    try {
      const userId = req.user.userId;
      const feed = await this.feedService.getCustomFeed(userId, query);

      let message = "Feed custom récupéré avec succès";
      let code = HttpStatus.OK;

      if (feed.noResultsReason === "no_matching_genres") {
        message = "Aucun événement ne correspond à vos genres préférés";
        code = HttpStatus.NO_CONTENT;
      } else if (feed.noResultsReason === "no_preferences") {
        message = "Aucune préférence : affichage de tous les événements disponibles";
      }

      return {
        success: true,
        code,
        message,
        data: feed,
      };
    } catch (error) {
      return {
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed",
      };
    }
  }

  @Public()
  @Get("all")
  async getAllEvents(@Query() query: GetFeedDto) {
    try {
      const feed = await this.feedService.getAllEventsFeed(query);

      return {
        success: true,
        code: HttpStatus.OK,
        message: "Tous les événements récupérés avec succès",
        data: feed,
      };
    } catch (error) {
      return {
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération des événements",
      };
    }
  }

  @Get("discovery")
  async getDiscoveryFeed(@Request() req, @Query() query: GetFeedDto) {
    try {
      const userId = req.user.userId;
      const feed = await this.feedService.getDiscoveryFeed(userId, query);

      return {
        success: true,
        code: HttpStatus.OK,
        message: "Feed découverte récupéré avec succès",
        data: feed,
      };
    } catch (error) {
      return {
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed découverte",
      };
    }
  }
}

@Controller("feed")
export class FeedPublicController {
  constructor(private readonly feedService: FeedService) {}

  @Get("public")
  async getPublicFeed(@Query() query: GetFeedDto) {
    try {
      // Si un segment est fourni, utiliser getAllEventsFeed avec filtres
      if (query.segment || query.genre) {
        const feed = await this.feedService.getAllEventsFeed(query);
        return {
          success: true,
          code: HttpStatus.OK,
          message: "Feed public filtré récupéré avec succès",
          data: feed,
        };
      }
      
      // Sinon, utiliser le feed public aléatoire
      const feed = await this.feedService.getPublicFeed(query);

      return {
        success: true,
        code: HttpStatus.OK,
        message: "Feed public récupéré avec succès",
        data: feed,
      };
    } catch (error) {
      console.error('Erreur dans getPublicFeed:', error);
      return {
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed public",
        error: error.message,
      };
    }
  }

}
