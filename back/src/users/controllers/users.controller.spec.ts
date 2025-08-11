import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "../services/users.service";
import { NotFoundException } from "@nestjs/common";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getUserProfileById: jest.fn(),
    createPreferences: jest.fn(),
    getUserPreferences: jest.fn(),
    deletePreference: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getProfile", () => {
    it("should return user profile with preferences successfully", async () => {
      const mockUserProfile = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        userPreferences: ["Rock", "Jazz"],
      };
      const req = { user: { userId: 1 } };
      mockUsersService.getUserProfileById.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(req);

      expect(usersService.getUserProfileById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Profile retrieved successfully",
        user: mockUserProfile,
      });
    });

    it("should throw NotFoundException when user is not found", async () => {
      const req = { user: { userId: 999 } };
      mockUsersService.getUserProfileById.mockResolvedValue(null);

      await expect(controller.getProfile(req)).rejects.toThrow(NotFoundException);
      expect(usersService.getUserProfileById).toHaveBeenCalledWith(999);
    });
  });

  describe("createPreferences", () => {
    it("should create preferences successfully", async () => {
      const mockPreferences = [
        {
          id: 1,
          classificationId: "test-id-1",
          classificationName: "Rock",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          classificationId: "test-id-2",
          classificationName: "Jazz",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const req = { user: { userId: 1 } };
      const body = { classificationNames: ["Rock", "Jazz"] };

      mockUsersService.createPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.createPreferences(req, body);

      expect(usersService.createPreferences).toHaveBeenCalledWith(1, body);
      expect(result).toEqual({
        success: true,
        message: "2 préférences créées",
        preferences: mockPreferences.map((p) => ({
          id: p.id,
          classificationId: p.classificationId,
          classificationName: p.classificationName,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      });
    });
  });

  describe("getUserPreferences", () => {
    it("should return user preferences", async () => {
      const mockPreferences = [
        {
          id: 1,
          classificationId: "test-id-1",
          classificationName: "Rock",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          classificationId: "test-id-2",
          classificationName: "Jazz",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const req = { user: { userId: 1 } };

      mockUsersService.getUserPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getUserPreferences(req);

      expect(usersService.getUserPreferences).toHaveBeenCalledWith(1);
      expect(result).toEqual(
        mockPreferences.map((p) => ({
          id: p.id,
          classificationId: p.classificationId,
          classificationName: p.classificationName,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      );
    });
  });

  describe("deletePreference", () => {
    it("should delete preference successfully", async () => {
      const req = { user: { userId: 1 } };
      const preferenceId = 1;

      mockUsersService.deletePreference.mockResolvedValue(undefined);

      await controller.deletePreference(req, preferenceId);

      expect(usersService.deletePreference).toHaveBeenCalledWith(1, preferenceId);
    });
  });
});
