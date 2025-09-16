import {
  Controller,
  Get,
  Post,
  Delete,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Body,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    const userProfile = await this.usersService.getUserProfileById(req.user.userId);
    if (!userProfile) {
      throw new NotFoundException({
        success: false,
        code: 404,
        message: "User not found",
      });
    }
    return {
      success: true,
      code: 200,
      message: "Profile retrieved successfully",
      user: userProfile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("preferences")
  @HttpCode(HttpStatus.CREATED)
  async createPreferences(@Request() req, @Body() body: any) {
    const userId = req.user.userId;
    const preferences = await this.usersService.createPreferences(userId, body);

    return {
      success: true,
      message: `${preferences.length} préférences créées`,
      preferences: preferences.map((preference) => ({
        id: preference.id,
        classificationId: preference.classificationId,
        classificationName: preference.classificationName,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("preferences")
  async getUserPreferences(@Request() req) {
    const userId = req.user.userId;
    const preferences = await this.usersService.getUserPreferences(userId);

    return preferences.map((preference) => ({
      id: preference.id,
      classificationId: preference.classificationId,
      classificationName: preference.classificationName,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    }));
  }

  // @UseGuards(JwtAuthGuard)
  // @Put("preferences/:id")
  // async updatePreference(
  //   @Request() req,
  //   @Param('id', ParseIntPipe) preferenceId: number,
  //   @Body() body: any,
  // ) {
  //   const userId = req.user.userId;
  //   const preference = await this.usersService.updatePreference(userId, preferenceId, body);

  //   return {
  //     id: preference.id,
  //     classificationId: preference.classificationId,
  //     classificationName: preference.classificationName,
  //     createdAt: preference.createdAt,
  //     updatedAt: preference.updatedAt,
  //   };
  // }

  @UseGuards(JwtAuthGuard)
  @Delete("preferences/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePreference(@Request() req, @Param("id", ParseIntPipe) preferenceId: number): Promise<void> {
    const userId = req.user.userId;
    await this.usersService.deletePreference(userId, preferenceId);
  }

  // Endpoints pour les favoris
  @UseGuards(JwtAuthGuard)
  @Post("favorites")
  @HttpCode(HttpStatus.CREATED)
  async addToFavorites(@Request() req, @Body() eventData: any) {
    const userId = req.user.userId;
    const favorite = await this.usersService.addToFavorites(userId, eventData);

    return {
      success: true,
      message: "Événement ajouté aux favoris",
      favorite: {
        id: favorite.id,
        eventId: favorite.eventId,
        eventName: favorite.eventName,
        eventDate: favorite.eventDate,
        eventVenue: favorite.eventVenue,
        eventCity: favorite.eventCity,
        eventImage: favorite.eventImage,
        eventUrl: favorite.eventUrl,
        createdAt: favorite.createdAt
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("favorites/:eventId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromFavorites(@Request() req, @Param("eventId") eventId: string): Promise<void> {
    const userId = req.user.userId;
    await this.usersService.removeFromFavorites(userId, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("favorites")
  async getUserFavorites(@Request() req) {
    const userId = req.user.userId;
    const favorites = await this.usersService.getUserFavorites(userId);

    return {
      success: true,
      code: 200,
      message: "Favoris récupérés",
      favorites: favorites.map(favorite => ({
        id: favorite.id,
        eventId: favorite.eventId,
        eventName: favorite.eventName,
        eventDate: favorite.eventDate,
        eventVenue: favorite.eventVenue,
        eventCity: favorite.eventCity,
        eventImage: favorite.eventImage,
        eventUrl: favorite.eventUrl,
        createdAt: favorite.createdAt
      }))
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("favorites/:eventId")
  async isEventInFavorites(@Request() req, @Param("eventId") eventId: string) {
    const userId = req.user.userId;
    const isFavorite = await this.usersService.isEventInFavorites(userId, eventId);

    return {
      success: true,
      isFavorite
    };
  }

}
