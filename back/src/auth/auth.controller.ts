import { 
  Controller, 
  Request, 
  Post, 
  UseGuards, 
  Body, 
  HttpCode, 
  HttpStatus,
  BadRequestException,
  ConflictException 
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    try {
      const result = await this.authService.login(req.user);
      return {
        success: true,
        code: 200,
        message: "Login successful",
        ...result
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Login failed",
        error: error.message
      });
    }
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Email and password are required"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Invalid email format"
      });
    }

    if (body.password.length < 6) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Password must be at least 6 characters long"
      });
    }

    try {
      const result = await this.authService.register(body.email, body.password);
      return {
        success: true,
        code: 201,
        message: "User registered successfully"
      };
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictException({
          success: false,
          code: 409,
          message: error.message
        });
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await this.authService.logout(req.user, token);
      return {
        success: true,
        code: 200,
        message: "Logout successful"
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Logout failed",
        error: error.message
      });
    }
  }
}
