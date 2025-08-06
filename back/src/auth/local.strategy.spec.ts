import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { LocalStrategy } from "./local.strategy";
import { AuthService } from "./auth.service";

describe("LocalStrategy", () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return user when credentials are valid", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate("test@test.com", "password123");

      expect(authService.validateUser).toHaveBeenCalledWith("test@test.com", "password123");
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate("test@test.com", "wrongpassword")).rejects.toThrow(
        new UnauthorizedException("Incorrect email or password")
      );
      expect(authService.validateUser).toHaveBeenCalledWith("test@test.com", "wrongpassword");
    });

    it("should throw UnauthorizedException when user is not found", async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate("nonexistent@test.com", "password123")).rejects.toThrow(
        new UnauthorizedException("Incorrect email or password")
      );
      expect(authService.validateUser).toHaveBeenCalledWith("nonexistent@test.com", "password123");
    });
  });
});
