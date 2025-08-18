import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";
import { BadRequestException, ConflictException } from "@nestjs/common";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should return success response with access token", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      const mockResult = { 
        user: { id: 1, username: "testuser", email: "test@test.com" },
        access_token: "jwt-token" 
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      const req = { user: mockUser };
      const result = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Login successful",
        user: { id: 1, username: "testuser", email: "test@test.com" },
        access_token: "jwt-token",
      });
    });

    it("should throw BadRequestException on error", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      mockAuthService.login.mockRejectedValue(new Error("Token generation failed"));

      const req = { user: mockUser };

      await expect(controller.login(req)).rejects.toThrow(BadRequestException);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("register", () => {
    it("should return success response for valid registration", async () => {
      const body = {
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      };
      const mockResult = {
        user: { id: 1, username: "testuser", email: "test@test.com" },
        access_token: "mockAccessToken"
      };
      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await controller.register(body);

      expect(authService.register).toHaveBeenCalledWith("testuser", "test@test.com", "password123");
      expect(result).toEqual({
        success: true,
        code: 201,
        message: "User registered successfully",
        user: { id: 1, username: "testuser", email: "test@test.com" },
        access_token: "mockAccessToken"
      });
    });

    it("should throw BadRequestException when username is missing", async () => {
      const body = {
        username: "",
        email: "test@test.com",
        password: "password123",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when email is missing", async () => {
      const body = {
        username: "testuser",
        email: "",
        password: "password123",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when password is missing", async () => {
      const body = {
        username: "testuser",
        email: "test@test.com",
        password: "",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when username is too short", async () => {
      const body = {
        username: "ab",
        email: "test@test.com",
        password: "password123",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when email format is invalid", async () => {
      const body = {
        username: "testuser",
        email: "invalid-email",
        password: "password123",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when password is too short", async () => {
      const body = {
        username: "testuser",
        email: "test@test.com",
        password: "12345",
      };

      await expect(controller.register(body)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException when user already exists", async () => {
      const body = {
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      };
      const conflictError = new ConflictException("User with this email already exists");
      Object.defineProperty(conflictError, "status", { value: 409 });
      mockAuthService.register.mockRejectedValue(conflictError);

      await expect(controller.register(body)).rejects.toThrow(ConflictException);
    });
  });

  describe("logout", () => {
    it("should return success response on successful logout", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      const token = "jwt-token";
      const req = {
        user: mockUser,
        headers: { authorization: `Bearer ${token}` },
      };
      mockAuthService.logout.mockResolvedValue({ message: "Logout successful" });

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith(mockUser, token);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Logout successful",
      });
    });

    it("should handle logout without authorization header", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      const req = {
        user: mockUser,
        headers: {},
      };
      mockAuthService.logout.mockResolvedValue({ message: "Logout successful" });

      const result = await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith(mockUser, undefined);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Logout successful",
      });
    });

    it("should throw BadRequestException on error", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com" };
      const req = {
        user: mockUser,
        headers: { authorization: "Bearer jwt-token" },
      };
      mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));

      await expect(controller.logout(req)).rejects.toThrow(BadRequestException);
    });
  });
});
