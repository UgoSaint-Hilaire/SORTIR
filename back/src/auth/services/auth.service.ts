import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../../users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../../users/entities/user.entity";
import { BlacklistedToken } from "../entities/blacklisted-token.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(BlacklistedToken)
    private blacklistedTokenRepository: Repository<BlacklistedToken>
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
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

      // Récupérer les préférences utilisateur
      const preferences = await this.usersService.getUserPreferences(user.id);
      const userPreferences = preferences.map((preference) => ({
        id: preference.id,
        classificationId: preference.classificationId,
        classificationName: preference.classificationName,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      }));

      const { password: _, ...userResult } = user;
      return {
        user: userResult,
        access_token,
        preferences: userPreferences,
      };
    } catch (error) {
      throw new InternalServerErrorException("Token generation failed");
    }
  }

  async register(username: string, email: string, password: string) {
    try {
      const existingUserByEmail = await this.usersService.findByEmail(email);
      if (existingUserByEmail) {
        throw new ConflictException("User with this email already exists");
      }

      const existingUserByUsername = await this.usersService.findByUsername(username);
      if (existingUserByUsername) {
        throw new ConflictException("User with this username already exists");
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltOrRounds);
      const user = await this.usersService.create(username, email, hashedPassword);

      if (!user) {
        throw new InternalServerErrorException("User creation failed");
      }

      // Générer le token JWT pour le nouvel utilisateur
      const payload = {
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
      };

      const access_token = this.jwtService.sign(payload);

      // Récupérer les préférences utilisateur (vides pour un nouvel utilisateur)
      const preferences = await this.usersService.getUserPreferences(user.id);
      const userPreferences = preferences.map((preference) => ({
        id: preference.id,
        classificationId: preference.classificationId,
        classificationName: preference.classificationName,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      }));

      const { password: _, ...userResult } = user;
      return {
        user: userResult,
        access_token,
        preferences: userPreferences,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException("Registration failed");
    }
  }

  async logout(user: Omit<User, 'password'>, token: string) {
    try {
      if (token) {
        const blacklistedToken = this.blacklistedTokenRepository.create({ token });
        await this.blacklistedTokenRepository.save(blacklistedToken);
      }
      return { message: "Logout successful" };
    } catch (error) {
      throw new InternalServerErrorException("Logout failed");
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.blacklistedTokenRepository.findOne({ 
      where: { token } 
    });
    return !!blacklistedToken;
  }
}
