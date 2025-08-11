import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/services/users.service";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BlacklistedToken } from "./blacklisted-token.entity";
import { Repository } from "typeorm";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let blacklistedTokenRepository: Repository<BlacklistedToken>;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockBlacklistedTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(BlacklistedToken),
          useValue: mockBlacklistedTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    blacklistedTokenRepository = module.get<Repository<BlacklistedToken>>(getRepositoryToken(BlacklistedToken));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user without pasword when credentials are valid", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await service.validateUser("test@test.com", "password123");

      expect(usersService.findByEmail).toHaveBeenCalledWith("test@test.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedPassword");
      expect(result).toEqual({
        id: 1,
        username: "testuser",
        email: "test@test.com",
      });
    });

    it("should return null when user is not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser("test@test.com", "password123");

      expect(usersService.findByEmail).toHaveBeenCalledWith("test@test.com");
      expect(result).toBeNull();
    });

    it("should return null when password is invalid", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      const result = await service.validateUser("test@test.com", "wrongpassword");

      expect(usersService.findByEmail).toHaveBeenCalledWith("test@test.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", "hashedPassword");
      expect(result).toBeNull();
    });

    it("should throw InternalServerErrorException on database error", async () => {
      mockUsersService.findByEmail.mockRejectedValue(new Error("Database error"));

      await expect(service.validateUser("test@test.com", "password123")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("login", () => {
    it("should return access token for valid user", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };
      const mockToken = "jwt-token";
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser as any);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        iat: expect.any(Number),
      });
      expect(result).toEqual({
        access_token: mockToken,
      });
    });

    it("should throw InternalServerErrorException when token generation fails", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
      };
      mockJwtService.sign.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      await expect(service.login(mockUser as any)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("register", () => {
    it("should create user successfully", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue("hashedPassword" as never);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register("testuser", "test@test.com", "password123");

      expect(usersService.findByEmail).toHaveBeenCalledWith("test@test.com");
      expect(usersService.findByUsername).toHaveBeenCalledWith("testuser");
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(usersService.create).toHaveBeenCalledWith("testuser", "test@test.com", "hashedPassword");
      expect(result).toEqual({
        id: 1,
        username: "testuser",
        email: "test@test.com",
      });
    });

    it("should throw ConflictException when email already exists", async () => {
      const existingUser = {
        id: 1,
        username: "existinguser",
        email: "test@test.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register("testuser", "test@test.com", "password123")).rejects.toThrow(ConflictException);
      expect(usersService.findByEmail).toHaveBeenCalledWith("test@test.com");
    });

    it("should throw ConflictException when username already exists", async () => {
      const existingUser = {
        id: 1,
        username: "testuser",
        email: "existing@test.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(existingUser);

      await expect(service.register("testuser", "test@test.com", "password123")).rejects.toThrow(ConflictException);
      expect(usersService.findByUsername).toHaveBeenCalledWith("testuser");
    });

    it("should throw InternalServerErrorException when user creation fails", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue("hashedPassword" as never);
      mockUsersService.create.mockResolvedValue(null);

      await expect(service.register("testuser", "test@test.com", "password123")).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("logout", () => {
    it("should blacklist token successfully", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = "jwt-token";
      const blacklistedToken = { id: 1, token, createdAt: new Date() };

      mockBlacklistedTokenRepository.create.mockReturnValue(blacklistedToken as any);
      mockBlacklistedTokenRepository.save.mockResolvedValue(blacklistedToken as any);

      const result = await service.logout(mockUser, token);

      expect(blacklistedTokenRepository.create).toHaveBeenCalledWith({ token });
      expect(blacklistedTokenRepository.save).toHaveBeenCalledWith(blacklistedToken);
      expect(result).toEqual({ message: "Logout successful" });
    });

    it("should handle logout without token", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.logout(mockUser, "");

      expect(blacklistedTokenRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({ message: "Logout successful" });
    });

    it("should throw InternalServerErrorException on database error", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const token = "jwt-token";

      mockBlacklistedTokenRepository.create.mockReturnValue({ token } as any);
      mockBlacklistedTokenRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.logout(mockUser, token)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("isTokenBlacklisted", () => {
    it("should return true when token is blacklisted", async () => {
      const token = "jwt-token";
      const blacklistedToken = { id: 1, token, createdAt: new Date() };
      mockBlacklistedTokenRepository.findOne.mockResolvedValue(blacklistedToken as any);

      const result = await service.isTokenBlacklisted(token);

      expect(blacklistedTokenRepository.findOne).toHaveBeenCalledWith({ where: { token } });
      expect(result).toBe(true);
    });

    it("should return false when token is not blacklisted", async () => {
      const token = "jwt-token";
      mockBlacklistedTokenRepository.findOne.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted(token);

      expect(blacklistedTokenRepository.findOne).toHaveBeenCalledWith({ where: { token } });
      expect(result).toBe(false);
    });
  });
});
