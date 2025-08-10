import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { EventsService } from "./events.service";
import { Event } from "../schemas/event.schema";

describe("EventsService", () => {
  let service: EventsService;

  const mockEventModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    countDocuments: jest.fn(),
    constructor: jest.fn(() => ({
      save: jest.fn(),
    })),
  };

  // Create a mock class that acts like a Mongoose model
  class MockEventModel {
    static findOne = jest.fn();
    static updateOne = jest.fn();
    static countDocuments = jest.fn();

    save = jest.fn();

    constructor(data: any) {
      Object.assign(this, data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: MockEventModel,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("saveInDBEvents", () => {
    const mockTicketmasterEvent = {
      id: "TM001",
      name: "Concert Test",
      dates: {
        start: {
          localDate: "2025-08-15",
          localTime: "20:00:00",
          dateTime: "2025-08-15T20:00:00Z",
        },
      },
    };

    it("should save new events successfully", async () => {
      MockEventModel.findOne.mockResolvedValue(null);
      MockEventModel.prototype.save = jest.fn().mockResolvedValue({});

      const result = await service.saveInDBEvents([mockTicketmasterEvent], "MUSIQUE");

      expect(MockEventModel.findOne).toHaveBeenCalledWith({
        ticketmasterId: "TM001",
      });
      expect(result.saved).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it("should update existing events successfully", async () => {
      const existingEvent = {
        ticketmasterId: "TM001",
        createdAt: "10/08/2025 10:00:00",
      };
      MockEventModel.findOne.mockResolvedValue(existingEvent);
      MockEventModel.updateOne.mockResolvedValue({});

      const result = await service.saveInDBEvents([mockTicketmasterEvent], "MUSIQUE");

      expect(MockEventModel.findOne).toHaveBeenCalledWith({
        ticketmasterId: "TM001",
      });
      expect(MockEventModel.updateOne).toHaveBeenCalled();
      expect(result.saved).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toBe(0);
    });

    // it("should handle transformation errors", async () => {
    //   const invalidEvent = {
    //     id: "TM001",
    //     name: "Invalid Event",
    //     // Missing dates - will cause transformation error
    //   };

    //   MockEventModel.findOne.mockResolvedValue(null);

    //   const result = await service.saveInDBEvents([invalidEvent], "MUSIQUE");

    //   expect(result.saved).toBe(0);
    //   expect(result.updated).toBe(0);
    //   expect(result.errors).toBe(1);
    // });
  });

  describe("getEventsNumber", () => {
    it("should return events count and last sync date", async () => {
      MockEventModel.countDocuments.mockResolvedValue(150);

      const mockQuery = {
        sort: jest.fn().mockResolvedValue({
          syncedAt: "11/08/2025 14:30:00",
        }),
      };
      MockEventModel.findOne.mockReturnValue(mockQuery);

      const result = await service.getEventsNumber();

      expect(MockEventModel.countDocuments).toHaveBeenCalled();
      expect(MockEventModel.findOne).toHaveBeenCalledWith({}, { syncedAt: 1 });
      expect(mockQuery.sort).toHaveBeenCalledWith({ _id: -1 });
      expect(result).toEqual({
        total: 150,
        lastSync: "11/08/2025 14:30:00",
      });
    });

    it("should handle database errors", async () => {
      MockEventModel.countDocuments.mockRejectedValue(new Error("Database connection failed"));

      await expect(service.getEventsNumber()).rejects.toThrow("Database connection failed");
    });
  });

  describe("transformTicketmasterEventToMongo", () => {
    it("should transform complete event correctly", () => {
      const tmEvent = {
        id: "TM001",
        name: "Concert Test",
        description: "Amazing concert",
        url: "https://test.com",
        images: [
          { url: "image1.jpg", width: 1024, height: 576, ratio: "16_9" },
          { url: "image2.jpg", width: 640, height: 427, ratio: "3_2" },
          { url: "image3.jpg", width: 500, height: 300, ratio: "5_3" },
        ],
        dates: {
          start: {
            localDate: "2025-08-15",
            localTime: "20:00:00",
            dateTime: "2025-08-15T20:00:00Z",
          },
          status: { code: "onsale" },
        },
        classifications: [
          {
            segment: { name: "MUSIQUE" },
            genre: { name: "Rock" },
            subGenre: { name: "Alternative Rock" },
          },
        ],
        _embedded: {
          venues: [
            {
              id: "V001",
              name: "Test Venue",
              type: "venue",
              url: "https://venue.com",
              locale: "fr-FR",
              city: { name: "Paris" },
              country: { name: "France", countryCode: "FR" },
              address: { line1: "123 Rue Test" },
              location: { latitude: "48.8566", longitude: "2.3522" },
              images: [{ url: "venue1.jpg", width: 1024, height: 576, ratio: "16_9" }],
            },
          ],
        },
        priceRanges: [{ min: 25.0, max: 150.0, currency: "EUR" }],
        sales: {
          public: { startDateTime: "2025-06-01T10:00:00Z" },
          presales: [{ startDateTime: "2025-05-01T10:00:00Z" }],
        },
      };

      const result = (service as any).transformTicketmasterEventToMongo(tmEvent, "MUSIQUE");

      expect(result).toMatchObject({
        ticketmasterId: "TM001",
        name: "Concert Test",
        description: "Amazing concert",
        url: "https://test.com",
        images: [
          { url: "image1.jpg", width: 1024, height: 576, ratio: "16_9" },
          { url: "image2.jpg", width: 640, height: 427, ratio: "3_2" },
        ],
        date: {
          localDate: "2025-08-15",
          localTime: "20:00:00",
          dateTime: "2025-08-15T20:00:00Z",
        },
        segment: "MUSIQUE",
        genre: "Rock",
        subGenre: "Alternative Rock",
        priceRange: { min: 25.0, max: 150.0, currency: "EUR" },
        status: "onsale",
      });

      expect(result.venue).toMatchObject({
        id: "V001",
        name: "Test Venue",
        city: "Paris",
        country: "France",
        countryCode: "FR",
        address: "123 Rue Test",
        latitude: 48.8566,
        longitude: 2.3522,
      });

      expect(result.syncedAt).toBeDefined();
    });
  });
});
