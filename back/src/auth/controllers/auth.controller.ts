import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "../services/auth.service";
import { AuthLoggerService } from "../services/auth-logger.service";
import { LocalAuthGuard } from "../guards/local-auth.guard";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { TooManyRequestsException } from "../exceptions/too-many-requests.exception";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private authLogger: AuthLoggerService
  ) {}

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    try {
      const recentFailedAttempts = await this.authLogger.getRecentFailedAttempts(req.body.email, 5);
      if (recentFailedAttempts >= 25) {
        await this.authLogger.logRateLimitExceeded("/auth/login", req);
        throw new TooManyRequestsException({
          success: false,
          code: 429,
          message: "Too many failed login attempts. Please try again in a few minutes.",
        });
      }

      const result = await this.authService.login(req.user);

      await this.authLogger.logLoginSuccess(req.user.email, req.user.id, req);

      return {
        success: true,
        code: 200,
        message: "Login successful",
        ...result,
      };
    } catch (error) {
      if (!(error instanceof TooManyRequestsException)) {
        await this.authLogger.logLoginFailed(req.body.email || "unknown", error.message, req);
      }

      if (error instanceof TooManyRequestsException) {
        throw error;
      }

      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Login failed",
        error: error.message,
      });
    }
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Request() req, @Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto.username, registerDto.email, registerDto.password);

      await this.authLogger.logRegisterSuccess(registerDto.username, registerDto.email, result.user.id, req);

      return {
        success: true,
        code: 201,
        message: "User registered successfully",
        ...result,
      };
    } catch (error) {
      await this.authLogger.logRegisterFailed(registerDto.username, registerDto.email, error.message, req);

      if (error.status === 409) {
        throw new ConflictException({
          success: false,
          code: 409,
          message: error.message,
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
      const token = req.headers.authorization?.replace("Bearer ", "");
      await this.authService.logout(req.user, token);

      await this.authLogger.logLogout(req.user.userId, req.user.email || "unknown", req);

      return {
        success: true,
        code: 200,
        message: "Logout successful",
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        code: 400,
        message: "Logout failed",
        error: error.message,
      });
    }
  }
}
