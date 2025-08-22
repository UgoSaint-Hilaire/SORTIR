import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
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
