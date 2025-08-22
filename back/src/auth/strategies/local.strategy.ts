import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { AuthLoggerService } from "../services/auth-logger.service";
import { User } from "../../users/entities/user.entity";
import { Request } from "express";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private authLogger: AuthLoggerService
  ) {
    super({
      usernameField: "email",
      passReqToCallback: true,
    });
  }

  async validate(req: Request, email: string, password: string): Promise<Omit<User, "password">> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      await this.authLogger.logLoginFailed(email, "Invalid credentials", req);
      throw new UnauthorizedException("Incorrect email or password");
    }
    return user;
  }
}
