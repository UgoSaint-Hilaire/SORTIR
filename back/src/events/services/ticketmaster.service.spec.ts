import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { TicketmasterService } from "./ticketmaster.service";
import { EventsService } from "./events.service";

// Mock fetch globally
global.fetch = jest.fn();

describe("TicketmasterService", () => {
  let service: TicketmasterService;
  let configService: ConfigService;
  let eventsService: EventsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventsService = {
    saveInDBEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketmasterService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<TicketmasterService>(TicketmasterService);
    configService = module.get<ConfigService>(ConfigService);
    eventsService = module.get<EventsService>(EventsService);

    // Default mock setup
    mockConfigService.get.mockReturnValue("test-api-key");
    (fetch as jest.Mock).mockClear();

    // Mock logger to suppress error logs in tests
    jest.spyOn((service as any).logger, "error").mockImplementation(() => {});
    jest.spyOn((service as any).logger, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("fetchAllFrenchEvents", () => {
    it("should fetch events from all segments successfully", async () => {
      const mockApiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          _embedded: {
            events: [
              {
                id: "TM001",
                name: "Test Event",
                dates: { start: { localDate: "2025-08-15" } },
                classifications: [{ segment: { id: "KZFzniwnSyZfZ7v7nJ" } }],
              },
            ],
          },
          page: { totalPages: 1 },
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockApiResponse);

      const mockSaveResult = { saved: 1, updated: 0, errors: 0 };
      mockEventsService.saveInDBEvents.mockResolvedValue(mockSaveResult);

      // Mock the private methods by spying on them
      const getEventsBySegmentSpy = jest.spyOn(service as any, "getEventsBySegmentInFrance");
      getEventsBySegmentSpy.mockResolvedValue({
        events: [{ id: "TM001", name: "Test Event" }],
        saveStats: mockSaveResult,
      });

      const result = await service.fetchAllFrenchEvents(1);

      expect(getEventsBySegmentSpy).toHaveBeenCalledTimes(3); // 3 segments
      expect(result.events).toHaveLength(3); // One event per segment
      expect(result.saveStats).toEqual({
        saved: 3,
        updated: 0,
        errors: 0,
      });
    });

    // Ajouter le test : should fetch events from all segments error ???
  });

  describe("getEventsBySegmentInFrance", () => {
    const mockFetchResponse = (events: any[] = [], totalPages = 1) => ({
      ok: true,
      json: jest.fn().mockResolvedValue({
        _embedded: { events },
        page: { totalPages },
      }),
    });

    it("should handle multiple days correctly", async () => {
      (service as any).apiKey = "test-api-key"; // Fix: Set API key

      const mockEvents = [{ id: "TM001", name: "Event 1" }];
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(mockEvents));
      mockEventsService.saveInDBEvents.mockResolvedValue({ saved: 1, updated: 0, errors: 0 });

      const result = await (service as any).getEventsBySegmentInFrance("KZFzniwnSyZfZ7v7nJ", "MUSIQUE", 2);

      expect(fetch).toHaveBeenCalledTimes(2); // Two days
      expect(result.events).toHaveLength(2); // Events from both days
      expect(result.saveStats.saved).toBe(2);
    });

    it("should handle days with no events", async () => {
      (service as any).apiKey = "test-api-key"; // Fix: Set API key

      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse([]));

      const result = await (service as any).getEventsBySegmentInFrance("KZFzniwnSyZfZ7v7nJ", "MUSIQUE", 1);

      expect(result.events).toHaveLength(0);
      expect(result.saveStats).toEqual({ saved: 0, updated: 0, errors: 0 });
      expect(mockEventsService.saveInDBEvents).not.toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
      (service as any).apiKey = "test-api-key"; // Fix: Set API key

      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await (service as any).getEventsBySegmentInFrance("KZFzniwnSyZfZ7v7nJ", "MUSIQUE", 1);

      expect(result.events).toHaveLength(0);
      expect(result.saveStats.errors).toBe(1);
    });
  });

  describe("fetchEventsForSingleDay", () => {
    it("should fetch single page successfully", async () => {
      const mockEvents = [{ id: "TM001", name: "Single Page Event" }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          _embedded: { events: mockEvents },
          page: { totalPages: 1 },
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await (service as any).fetchEventsForSingleDay(
        "segment-id",
        "MUSIQUE",
        "2025-08-15T00:00:00Z",
        "2025-08-16T00:00:00Z"
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEvents);
    });

    it("should fetch multiple pages", async () => {
      const page1Events = [{ id: "TM001", name: "Page 1 Event" }];
      const page2Events = [{ id: "TM002", name: "Page 2 Event" }];

      const mockResponse1 = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          _embedded: { events: page1Events },
          page: { totalPages: 2 },
        }),
      };

      const mockResponse2 = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          _embedded: { events: page2Events },
          page: { totalPages: 2 },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const result = await (service as any).fetchEventsForSingleDay(
        "segment-id",
        "MUSIQUE",
        "2025-08-15T00:00:00Z",
        "2025-08-16T00:00:00Z"
      );

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result).toEqual([...page1Events, ...page2Events]);
    });

    it("should handle API response errors", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue("Bad Request"),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        (service as any).fetchEventsForSingleDay(
          "segment-id",
          "MUSIQUE",
          "2025-08-15T00:00:00Z",
          "2025-08-16T00:00:00Z"
        )
      ).rejects.toThrow("API error 400: Bad Request");
    });
  });

  describe("addCorrespondingNameOfSegment", () => {
    it("should enrich events with classification names", () => {
      const events = [
        {
          id: "TM001",
          name: "Music Event",
          classifications: [
            {
              segment: { id: "KZFzniwnSyZfZ7v7nJ" },
              genre: { id: "KnvZfZ7vAeA" },
            },
          ],
        },
        {
          id: "TM002",
          name: "Event without classification",
        },
      ];

      const result = (service as any).addCorrespondingNameOfSegment(events);

      expect(result).toHaveLength(2);
      expect(result[0].classifications[0].segment.name).toBeDefined();
      expect(result[0].classifications[0].genre.name).toBeDefined();
      expect(result[1]).toEqual(events[1]); // Unchanged
    });
  });
});
