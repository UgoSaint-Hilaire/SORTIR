import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { TicketmasterService } from "../services/ticketmaster.service";
import { EventsService } from "../services/events.service";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

describe("EventsController", () => {
  let controller: EventsController;
  let ticketmasterService: TicketmasterService;
  let eventsService: EventsService;

  const mockTicketmasterService = {
    fetchAllFrenchEvents: jest.fn(),
  };

  const mockEventsService = {
    getEventsNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: TicketmasterService,
          useValue: mockTicketmasterService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    ticketmasterService = module.get<TicketmasterService>(TicketmasterService);
    eventsService = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("syncAllEvents", () => {
    it("should sync events successfully with default 30 days", async () => {
      const mockResult = {
        events: [
          { id: "1", name: "Event 1" },
          { id: "2", name: "Event 2" },
        ],
        saveStats: {
          saved: 2,
          updated: 0,
          errors: 0,
        },
      };
      mockTicketmasterService.fetchAllFrenchEvents.mockResolvedValue(mockResult);

      const result = await controller.syncAllEvents({});

      expect(ticketmasterService.fetchAllFrenchEvents).toHaveBeenCalledWith(30);
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Events retrieved and added to mongo database - (30 days)",
        total: 2,
        saved: 2,
        updated: 0,
        errors: 0,
        events: mockResult.events,
      });
    });

    it("should throw BadRequestException for days less than 1", async () => {
      await expect(controller.syncAllEvents({ days: -1 })).rejects.toThrow(
        new BadRequestException({
          success: false,
          code: 400,
          message: "Days must be minimum 1 and maximum365",
        })
      );

      expect(ticketmasterService.fetchAllFrenchEvents).not.toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException when service fails", async () => {
      const errorMessage = "API connection failed";
      mockTicketmasterService.fetchAllFrenchEvents.mockRejectedValue(new Error(errorMessage));

      await expect(controller.syncAllEvents({ days: 30 })).rejects.toThrow(
        new InternalServerErrorException({
          success: false,
          code: 500,
          message: "Failed to retrieve events",
          error: errorMessage,
          total: 0,
          saved: 0,
          updated: 0,
          errors: 1,
          events: [],
        })
      );

      expect(ticketmasterService.fetchAllFrenchEvents).toHaveBeenCalledWith(30);
    });
  });

  describe("getEventsNumber", () => {
    it("should return events stats successfully", async () => {
      const mockStats = {
        total: 150,
        lastSync: "11/08/2025 14:30:00",
      };
      mockEventsService.getEventsNumber.mockResolvedValue(mockStats);

      const result = await controller.getEventsNumber();

      expect(eventsService.getEventsNumber).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        code: 200,
        message: "Events stats retrieved successfully",
        stats: mockStats,
      });
    });

    it("should throw InternalServerErrorException when service fails", async () => {
      const errorMessage = "Database connection failed";
      mockEventsService.getEventsNumber.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getEventsNumber()).rejects.toThrow(
        new InternalServerErrorException({
          success: false,
          code: 500,
          message: "Failed to retrieve events number",
          error: errorMessage,
          stats: null,
        })
      );

      expect(eventsService.getEventsNumber).toHaveBeenCalled();
    });
  });
});
