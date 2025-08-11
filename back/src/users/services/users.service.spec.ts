import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { UserPreference } from "../entities/user-preference.entity";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import * as ticketmasterClassifications from "../../events/constants/ticketmaster-classifications";

// Mock du module ticketmaster-classifications
jest.mock("../../events/constants/ticketmaster-classifications", () => ({
  getClassificationId: jest.fn(),
}));

describe("UsersService", () => {
  let service: UsersService;
  let repository: Repository<User>;
  let preferencesRepository: Repository<UserPreference>;

  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPreferencesRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockPreferencesRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    preferencesRepository = module.get<Repository<UserPreference>>(getRepositoryToken(UserPreference));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByEmail", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@test.com");

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: "test@test.com" } });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail("nonexistent@test.com");

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: "nonexistent@test.com" } });
      expect(result).toBeNull();
    });
  });

  describe("findByUsername", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername("testuser");

      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: "testuser" } });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername("nonexistent");

      expect(repository.findOne).toHaveBeenCalledWith({ where: { username: "nonexistent" } });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and save user successfully", async () => {
      const userData = {
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
      };
      const mockUser = {
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create("testuser", "test@test.com", "hashedPassword");

      expect(repository.create).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe("getUserProfileById", () => {
    it("should return user profile with preferences when user exists", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@test.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockPreferences = [{ classificationName: "Rock" }, { classificationName: "Jazz" }];

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockPreferencesRepository.find.mockResolvedValue(mockPreferences);

      const result = await service.getUserProfileById(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        username: "testuser",
        email: "test@test.com",
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        userPreferences: ["Rock", "Jazz"],
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should return null when user is not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserProfileById(999);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeNull();
    });
  });

  describe("createPreferences", () => {
    it("should create preferences successfully", async () => {
      const mockGetClassificationId = ticketmasterClassifications.getClassificationId as jest.Mock;

      const mockData = {
        classificationNames: ["Rock", "Jazz"],
      };
      const mockCreatedPreferences = [
        {
          id: 1,
          userId: 1,
          classificationId: "test-id-rock",
          classificationName: "Rock",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          classificationId: "test-id-jazz",
          classificationName: "Jazz",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock des retours de getClassificationId
      mockGetClassificationId.mockReturnValueOnce("test-id-rock").mockReturnValueOnce("test-id-jazz");

      mockPreferencesRepository.findOne.mockResolvedValue(null); // Pas de préférence existante
      mockPreferencesRepository.create
        .mockReturnValueOnce(mockCreatedPreferences[0])
        .mockReturnValueOnce(mockCreatedPreferences[1]);
      mockPreferencesRepository.save
        .mockResolvedValueOnce(mockCreatedPreferences[0])
        .mockResolvedValueOnce(mockCreatedPreferences[1]);

      const result = await service.createPreferences(1, mockData);

      expect(result).toEqual(mockCreatedPreferences);
      expect(mockGetClassificationId).toHaveBeenCalledWith("Rock");
      expect(mockGetClassificationId).toHaveBeenCalledWith("Jazz");
    });

    it("should throw error when classificationNames is not array", async () => {
      const mockData = {
        classificationNames: "not-an-array",
      };

      await expect(service.createPreferences(1, mockData)).rejects.toThrow(BadRequestException);
    });

    it("should throw error when classificationNames is empty", async () => {
      const mockData = {
        classificationNames: [],
      };

      await expect(service.createPreferences(1, mockData)).rejects.toThrow(BadRequestException);
    });

    it("should throw error when classification is not found", async () => {
      const mockGetClassificationId = ticketmasterClassifications.getClassificationId as jest.Mock;

      const mockData = {
        classificationNames: ["UnknownGenre"],
      };

      mockGetClassificationId.mockReturnValue(null); // Classification non trouvée

      await expect(service.createPreferences(1, mockData)).rejects.toThrow(BadRequestException);
      expect(mockGetClassificationId).toHaveBeenCalledWith("UnknownGenre");
    });
  });

  describe("getUserPreferences", () => {
    it("should return user preferences", async () => {
      const mockPreferences = [
        {
          id: 1,
          userId: 1,
          classificationId: "test-id-1",
          classificationName: "Rock",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          classificationId: "test-id-2",
          classificationName: "Jazz",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPreferencesRepository.find.mockResolvedValue(mockPreferences);

      const result = await service.getUserPreferences(1);

      expect(preferencesRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { classificationName: "ASC" },
      });
      expect(result).toEqual(mockPreferences);
    });
  });

  describe("deletePreference", () => {
    it("should delete preference successfully", async () => {
      mockPreferencesRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deletePreference(1, 1);

      expect(preferencesRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userId: 1,
      });
    });

    it("should throw error when preference not found", async () => {
      mockPreferencesRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deletePreference(1, 999)).rejects.toThrow();
    });
  });
});
