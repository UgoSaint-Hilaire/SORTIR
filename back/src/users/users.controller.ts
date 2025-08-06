import { 
  Controller, 
  Get, 
  Request, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  NotFoundException 
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

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
        message: "User not found"
      });
    }
    return {
      success: true,
      code: 200,
      message: "Profile retrieved successfully",
      user: userProfile
    };
  }
}