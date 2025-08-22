import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthService } from "./services/auth.service";
import { AuthLoggerService } from "./services/auth-logger.service";
import { AuthController } from "./controllers/auth.controller";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { BlacklistedToken } from "./entities/blacklisted-token.entity";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([BlacklistedToken]),
    ThrottlerModule.forRoot([
      {
        // 5 tentatives max toute les minutes
        name: "auth-short",
        ttl: 60000,
        limit: 5,
      },
      // 20 tentatives max toute les 15 minutes
      {
        name: "auth-long",
        ttl: 900000,
        limit: 20,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: configService.get<string>("JWT_EXPIRES_IN") },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthLoggerService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthLoggerService],
})
export class AuthModule {}
