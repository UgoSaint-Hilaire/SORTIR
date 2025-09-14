import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { FeedController, FeedPublicController } from "./feed.controller";
import { FeedService } from "../services/feed.service";
import { GetFeedDto } from "../dto/get-feed.dto";
import { FeedResponseDto } from "../dto/feed-response.dto";

describe("FeedController", () => {
  let controller: FeedController;
  let mockFeedService: any;

  const mockUser = { userId: 1 };
  const mockRequest = { user: mockUser };

  const mockFeedResponse: FeedResponseDto = {
    events: [
      {
        _id: "1",
        ticketmasterId: "tm1",
        name: "Concert Rock",
        date: { localDate: "2025-08-15", localTime: "20:00:00" },
        segment: "Musique",
        genre: "Rock",
        status: "onsale",
      },
    ] as any,
    pagination: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    noResultsReason: null,
  };

  beforeEach(async () => {
    mockFeedService = {
      getCustomFeed: jest.fn(),
      getAllEventsFeed: jest.fn(),
      getDiscoveryFeed: jest.fn(),
      getPublicFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    }).compile();

    controller = module.get<FeedController>(FeedController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPersonalizedFeed", () => {
    it("should return successful response with events", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getCustomFeed.mockResolvedValue(mockFeedResponse);

      const result = await controller.getPersonalizedFeed(mockRequest, query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Feed custom récupéré avec succès",
        data: mockFeedResponse,
      });
      expect(mockFeedService.getCustomFeed).toHaveBeenCalledWith(1, query);
    });

    it("should return no_matching_genres message with NO_CONTENT status", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      const feedWithNoResults = {
        ...mockFeedResponse,
        events: [],
        noResultsReason: "no_matching_genres" as const,
        pagination: { ...mockFeedResponse.pagination, total: 0 },
      };

      mockFeedService.getCustomFeed.mockResolvedValue(feedWithNoResults);

      const result = await controller.getPersonalizedFeed(mockRequest, query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.NO_CONTENT,
        message: "Aucun événement ne correspond à vos genres préférés",
        data: feedWithNoResults,
      });
    });

    it("should return no_preferences message with OK status", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      const feedWithNoPreferences = {
        ...mockFeedResponse,
        noResultsReason: "no_preferences" as const,
      };

      mockFeedService.getCustomFeed.mockResolvedValue(feedWithNoPreferences);

      const result = await controller.getPersonalizedFeed(mockRequest, query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Aucune préférence : affichage de tous les événements disponibles",
        data: feedWithNoPreferences,
      });
    });

    it("should handle service errors", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getCustomFeed.mockRejectedValue(new Error("Database error"));

      const result = await controller.getPersonalizedFeed(mockRequest, query);

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed",
      });
    });
  });

  describe("getAllEvents", () => {
    it("should return successful response", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockFeedResponse);

      const result = await controller.getAllEvents(query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Tous les événements récupérés avec succès",
        data: mockFeedResponse,
      });
      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
    });

    it("should handle service errors", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getAllEventsFeed.mockRejectedValue(new Error("Database error"));

      const result = await controller.getAllEvents(query);

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération des événements",
      });
    });

    it("should pass query parameters correctly", async () => {
      const query: GetFeedDto = { page: 2, limit: 10, segments: ["Sports"], genres: ["Football"] };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockFeedResponse);

      await controller.getAllEvents(query);

      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
    });

    it("should handle multiple segments and genres", async () => {
      const query: GetFeedDto = { 
        page: 1, 
        limit: 20, 
        segments: ["Sports", "Musique"], 
        genres: ["Football", "Rock", "Jazz"] 
      };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockFeedResponse);

      await controller.getAllEvents(query);

      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
    });
  });

  describe("getDiscoveryFeed", () => {
    it("should return successful response", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getDiscoveryFeed.mockResolvedValue(mockFeedResponse);

      const result = await controller.getDiscoveryFeed(mockRequest, query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Feed découverte récupéré avec succès",
        data: mockFeedResponse,
      });
      expect(mockFeedService.getDiscoveryFeed).toHaveBeenCalledWith(1, query);
    });

    it("should handle service errors", async () => {
      const query: GetFeedDto = { page: 1, limit: 20 };
      mockFeedService.getDiscoveryFeed.mockRejectedValue(new Error("Database error"));

      const result = await controller.getDiscoveryFeed(mockRequest, query);

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed découverte",
      });
    });
  });

  describe("getGenreCounts", () => {
    beforeEach(() => {
      mockFeedService.getGenreCounts = jest.fn();
    });

    it("should return successful response with genre counts", async () => {
      const mockCounts = {
        "Rock": 15,
        "Jazz": 8,
        "Football": 25,
        "Basketball": 12
      };
      mockFeedService.getGenreCounts.mockResolvedValue(mockCounts);

      const result = await controller.getGenreCounts();

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Compteurs par genre récupérés avec succès",
        data: mockCounts,
      });
      expect(mockFeedService.getGenreCounts).toHaveBeenCalledWith();
    });

    it("should handle empty genre counts", async () => {
      mockFeedService.getGenreCounts.mockResolvedValue({});

      const result = await controller.getGenreCounts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("should handle service errors", async () => {
      mockFeedService.getGenreCounts.mockRejectedValue(new Error("Database error"));

      const result = await controller.getGenreCounts();

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération des compteurs par genre",
      });
    });
  });
});

describe("FeedPublicController", () => {
  let controller: FeedPublicController;
  let mockFeedService: any;

  const mockPublicFeedResponse: FeedResponseDto = {
    events: [
      {
        _id: "1",
        ticketmasterId: "tm1",
        name: "Concert Rock",
        date: { localDate: "2025-08-15", localTime: "20:00:00" },
        segment: "Musique",
        genre: "Rock",
        status: "onsale",
      },
      {
        _id: "2",
        ticketmasterId: "tm2",
        name: "Match Football",
        date: { localDate: "2025-08-16", localTime: "19:00:00" },
        segment: "Sports",
        genre: "Football",
        status: "onsale",
      },
      {
        _id: "3",
        ticketmasterId: "tm3",
        name: "Pièce Théâtre",
        date: { localDate: "2025-08-17", localTime: "21:00:00" },
        segment: "Arts & Théâtre",
        genre: "Théâtre",
        status: "onsale",
      },
    ] as any,
    pagination: {
      total: 100,
      page: 1,
      limit: 30,
      totalPages: 4,
      hasNext: true,
      hasPrev: false,
    },
  };

  beforeEach(async () => {
    mockFeedService = {
      getPublicFeed: jest.fn(),
      getAllEventsFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedPublicController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    }).compile();

    controller = module.get<FeedPublicController>(FeedPublicController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPublicFeed", () => {
    it("should return successful response with mixed events", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };
      mockFeedService.getPublicFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Feed public récupéré avec succès",
        data: mockPublicFeedResponse,
      });
      expect(mockFeedService.getPublicFeed).toHaveBeenCalledWith(query);
    });

    it("should work without query parameters (use defaults)", async () => {
      const emptyQuery: GetFeedDto = {};
      mockFeedService.getPublicFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(emptyQuery);

      expect(result.success).toBe(true);
      expect(mockFeedService.getPublicFeed).toHaveBeenCalledWith(emptyQuery);
    });

    it("should handle empty feed response", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };
      const emptyFeedResponse: FeedResponseDto = {
        events: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 30,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockFeedService.getPublicFeed.mockResolvedValue(emptyFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result.success).toBe(true);
      expect(result.data.events).toHaveLength(0);
      expect(result.data.pagination.total).toBe(0);
    });

    it("should handle service errors", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };
      mockFeedService.getPublicFeed.mockRejectedValue(new Error("Database connection failed"));

      const result = await controller.getPublicFeed(query);

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed public",
        error: "Database connection failed",
      });
    });

    it("should return events from different segments", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };
      mockFeedService.getPublicFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      const segments = result.data.events.map((event: any) => event.segment);
      expect(segments).toContain("Musique");
      expect(segments).toContain("Sports");
      expect(segments).toContain("Arts & Théâtre");
    });

    it("should use getAllEventsFeed when segments are provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 30, segments: ["Sports", "Musique"] };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result).toEqual({
        success: true,
        code: HttpStatus.OK,
        message: "Feed public filtré récupéré avec succès",
        data: mockPublicFeedResponse,
      });
      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
      expect(mockFeedService.getPublicFeed).not.toHaveBeenCalled();
    });

    it("should use getAllEventsFeed when genres are provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 30, genres: ["Rock", "Football"] };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result.message).toBe("Feed public filtré récupéré avec succès");
      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
      expect(mockFeedService.getPublicFeed).not.toHaveBeenCalled();
    });

    it("should use getAllEventsFeed when legacy genre parameter is provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 30, genre: "Rock" };
      mockFeedService.getAllEventsFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result.message).toBe("Feed public filtré récupéré avec succès");
      expect(mockFeedService.getAllEventsFeed).toHaveBeenCalledWith(query);
      expect(mockFeedService.getPublicFeed).not.toHaveBeenCalled();
    });

    it("should use getPublicFeed when no filters are provided", async () => {
      const query: GetFeedDto = { page: 1, limit: 30 };
      mockFeedService.getPublicFeed.mockResolvedValue(mockPublicFeedResponse);

      const result = await controller.getPublicFeed(query);

      expect(result.message).toBe("Feed public récupéré avec succès");
      expect(mockFeedService.getPublicFeed).toHaveBeenCalledWith(query);
      expect(mockFeedService.getAllEventsFeed).not.toHaveBeenCalled();
    });

    it("should handle error from getAllEventsFeed", async () => {
      const query: GetFeedDto = { segments: ["Sports"] };
      mockFeedService.getAllEventsFeed.mockRejectedValue(new Error("Filter error"));

      const result = await controller.getPublicFeed(query);

      expect(result).toEqual({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Erreur lors de la récupération du feed public",
        error: "Filter error",
      });
    });
  });
});
