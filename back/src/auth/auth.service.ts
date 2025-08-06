import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "src/users/user.entity";

@Injectable()
export class AuthService {
  private blacklistedTokens: Set<string> = new Set();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findOne(email);
      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException("Authentication error");
    }
  }

  async login(user: User) {
    try {
      const payload = {
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
      };

      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
      };
    } catch (error) {
      throw new InternalServerErrorException("Token generation failed");
    }
  }

  async register(email: string, password: string) {
    try {
      const existingUser = await this.usersService.findOne(email);
      if (existingUser) {
        throw new ConflictException("User already exists");
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltOrRounds);
      const user = await this.usersService.create(email, hashedPassword);

      if (!user) {
        throw new InternalServerErrorException("User creation failed");
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException("Registration failed");
    }
  }

  async logout(user: any, token: string) {
    try {
      if (token) {
        this.blacklistedTokens.add(token);
      }
      return { message: "Logout successful" };
    } catch (error) {
      throw new InternalServerErrorException("Logout failed");
    }
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
