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
  constructor(private readonly usersService: UsersService) {}

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
}
