import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { TicketmasterService } from './ticketmaster.service';
import { SchedulerLoggerService } from './scheduler-logger.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let ticketmasterService: jest.Mocked<TicketmasterService>;
  let schedulerLogger: jest.Mocked<SchedulerLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: TicketmasterService,
          useValue: {
            fetchAllFrenchEvents: jest.fn(),
          },
        },
        {
          provide: SchedulerLoggerService,
          useValue: {
            logJobStart: jest.fn(),
            logJobSuccess: jest.fn(),
            logJobError: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    ticketmasterService = module.get(TicketmasterService);
    schedulerLogger = module.get(SchedulerLoggerService);
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerManualSchedule', () => {
    it('should successfully trigger manual schedule', async () => {
      const mockResult = {
        events: [],
        saveStats: { saved: 10, updated: 5, errors: 0 },
      };
      ticketmasterService.fetchAllFrenchEvents.mockResolvedValue(mockResult);

      const result = await service.triggerManualSchedule();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        saved: 10,
        updated: 5,
        errors: 0,
        total: 0,
      });
      expect(schedulerLogger.logJobStart).toHaveBeenCalled();
      expect(schedulerLogger.logJobSuccess).toHaveBeenCalledWith(10, 5, 0, expect.any(Number));
    });

    it('should handle errors in manual schedule', async () => {
      ticketmasterService.fetchAllFrenchEvents.mockRejectedValue(new Error('API Error'));

      const result = await service.triggerManualSchedule();

      expect(result.success).toBe(false);
      expect(result.message).toContain('API Error');
      expect(schedulerLogger.logJobError).toHaveBeenCalled();
    });
  });

  describe('handleDailyEventSync', () => {
    it('should handle daily sync successfully', async () => {
      const mockResult = {
        events: [{ id: '1' }],
        saveStats: { saved: 1, updated: 0, errors: 0 },
      };
      ticketmasterService.fetchAllFrenchEvents.mockResolvedValue(mockResult);

      await service.handleDailyEventSync();

      expect(ticketmasterService.fetchAllFrenchEvents).toHaveBeenCalledWith(1, expect.any(Date));
      expect(schedulerLogger.logJobSuccess).toHaveBeenCalled();
    });

    it('should handle daily sync errors', async () => {
      ticketmasterService.fetchAllFrenchEvents.mockRejectedValue(new Error('Network Error'));

      await service.handleDailyEventSync();

      expect(schedulerLogger.logJobError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Network Error' }),
        expect.any(Number)
      );
    });
  });
});