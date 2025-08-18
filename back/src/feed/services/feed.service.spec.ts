import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { FeedService } from "../services/feed.service";
import { UsersService } from "../../users/services/users.service";
import { Event } from "../../events/schemas/event.schema";
import { GetFeedDto } from "../dto/get-feed.dto";

describe("FeedService", () => {
  let service: FeedService;
  let mockEventModel: any;
  let mockUsersService: any;

  const mockEvents = [
    {
      _id: "1",
      ticketmasterId: "tm1",
      name: "Concert Rock",
      date: { localDate: "2025-08-15", localTime: "20:00:00" },
      segment: "Musique",
      genre: "Rock",
      status: "onsale",
      syncedAt: "2025-08-12T10:00:00Z",
    },
    {
      _id: "2",
      ticketmasterId: "tm2",
      name: "Match Football",
      date: { localDate: "2025-08-16", localTime: "19:00:00" },
      segment: "Sports",
      genre: "Football",
      status: "onsale",
      syncedAt: "2025-08-12T11:00:00Z",
    },
    {
      _id: "3",
      ticketmasterId: "tm3",
      name: "Pièce Théâtre",
      date: { localDate: "2025-08-17", localTime: "21:00:00" },
      segment: "Arts & Théâtre",
      genre: "Théâtre",
      status: "onsale",
      syncedAt: "2025-08-12T12:00:00Z",
    },
  ];

  const mockUserPreferences = [
    {
      id: 1,
      userId: 1,
      classificationId: "rock-id",
      classificationName: "Rock",
    },
    {
      id: 2,
      userId: 1,
      classificationId: "football-id",
      classificationName: "Football",
    },
  ];

  beforeEach(async () => {
    mockEventModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn().mockReturnThis(),
    };

    mockUsersService = {
      getUserPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCustomFeed", () => {
    it("should return personalized feed with user preferences", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([mockEvents[0], mockEvents[1]]);
      mockEventModel.countDocuments.mockResolvedValue(2);

      const result = await service.getCustomFeed(userId, query);

      expect(result.events).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.noResultsReason).toBeNull();
      expect(mockUsersService.getUserPreferences).toHaveBeenCalledWith(userId);
    });

    it("should return no_preferences reason when user has no preferences", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([]);
      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      const result = await service.getCustomFeed(userId, query);

      expect(result.noResultsReason).toBe("no_preferences");
      expect(result.events).toHaveLength(3);
    });

    it("should return no_matching_genres reason when no events match preferences", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([{ classificationName: "Jazz" }]);
      mockEventModel.exec.mockResolvedValue([]);
      mockEventModel.countDocuments.mockResolvedValue(0);

      const result = await service.getCustomFeed(userId, query);

      expect(result.noResultsReason).toBe("no_matching_genres");
      expect(result.events).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should filter by preferred genres", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([{ classificationName: "Rock" }]);
      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getCustomFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: { $in: ["Rock"] },
        })
      );
    });

    it("should apply date and time filtering", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([]);
      mockEventModel.countDocuments.mockResolvedValue(0);

      await service.getCustomFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({
              "date.localDate": expect.objectContaining({ $gt: expect.any(String) }),
            }),
            expect.objectContaining({
              "date.localDate": expect.any(String),
              "date.localTime": expect.objectContaining({ $gte: expect.any(String) }),
            }),
          ]),
        })
      );
    });

    it("should handle pagination correctly", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 2, limit: 10 };

      mockUsersService.getUserPreferences.mockResolvedValue(mockUserPreferences);
      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(25);

      const result = await service.getCustomFeed(userId, query);

      expect(mockEventModel.skip).toHaveBeenCalledWith(10);
      expect(mockEventModel.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe("getAllEventsFeed", () => {
    it("should return all events without filters", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      const result = await service.getAllEventsFeed(query);

      expect(result.events).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it("should filter by segment when provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 20, segment: "Sports" };

      mockEventModel.exec.mockResolvedValue([mockEvents[1]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: "Sports",
        })
      );
    });

    it("should filter by genre when provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 20, genre: "Rock" };

      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: "Rock",
        })
      );
    });

    it("should filter by both segment and genre when provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 20, segment: "Musique", genre: "Rock" };

      mockEventModel.exec.mockResolvedValue([mockEvents[0]]);
      mockEventModel.countDocuments.mockResolvedValue(1);

      await service.getAllEventsFeed(query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          segment: "Musique",
          genre: "Rock",
        })
      );
    });
  });

  describe("getDiscoveryFeed", () => {
    it("should exclude user preferred genres", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([{ classificationName: "Rock" }]);
      mockEventModel.exec.mockResolvedValue([mockEvents[1], mockEvents[2]]);
      mockEventModel.countDocuments.mockResolvedValue(2);

      await service.getDiscoveryFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: { $nin: ["Rock"] },
        })
      );
    });

    it("should return all events when user has no preferences", async () => {
      const userId = 1;
      const query: GetFeedDto = { page: 1, limit: 20 };

      mockUsersService.getUserPreferences.mockResolvedValue([]);
      mockEventModel.exec.mockResolvedValue(mockEvents);
      mockEventModel.countDocuments.mockResolvedValue(3);

      await service.getDiscoveryFeed(userId, query);

      expect(mockEventModel.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          genre: expect.anything(),
        })
      );
    });
  });

  describe("getPublicFeed", () => {
    beforeEach(() => {
      mockEventModel.countDocuments.mockResolvedValue(150);
      mockEventModel.exec.mockResolvedValue(mockEvents);
    });

    it("should return sampled events using $sample aggregation", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };

      const result = await service.getPublicFeed(query);

      expect(result.events).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
      expect(mockEventModel.aggregate).toHaveBeenCalledWith([
        { $match: expect.any(Object) },
        { $sample: { size: 150 } },
      ]);
    });

    it("should limit sample size to available events", async () => {
      mockEventModel.countDocuments.mockResolvedValue(50);
      const query: GetFeedDto = { page: 1, limit: 30 };

      await service.getPublicFeed(query);

      expect(mockEventModel.aggregate).toHaveBeenCalledWith([
        { $match: expect.any(Object) },
        { $sample: { size: 50 } },
      ]);
    });

    it("should return empty array when no events available", async () => {
      mockEventModel.countDocuments.mockResolvedValue(0);
      const query: GetFeedDto = { page: 1, limit: 30 };

      const result = await service.getPublicFeed(query);

      expect(result.events).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(mockEventModel.aggregate).not.toHaveBeenCalled();
    });
  });
});
