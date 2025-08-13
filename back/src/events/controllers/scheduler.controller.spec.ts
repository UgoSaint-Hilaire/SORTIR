import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from '../services/scheduler.service';
import { SchedulerLoggerService } from '../services/scheduler-logger.service';

describe('SchedulerController', () => {
  let controller: SchedulerController;
  let schedulerService: jest.Mocked<SchedulerService>;
  let schedulerLogger: jest.Mocked<SchedulerLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [
        {
          provide: SchedulerService,
          useValue: {
            triggerManualSchedule: jest.fn(),
          },
        },
        {
          provide: SchedulerLoggerService,
          useValue: {
            readLogFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
    schedulerService = module.get(SchedulerService);
    schedulerLogger = module.get(SchedulerLoggerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('triggerManualSchedule', () => {
    it('should trigger manual schedule successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Manual schedule completed successfully in 2.5s',
        targetDate: '2025-10-12',
        stats: { saved: 10, updated: 5, errors: 0, total: 15 },
      };
      schedulerService.triggerManualSchedule.mockResolvedValue(mockResult);

      const result = await controller.triggerManualSchedule();

      expect(result).toEqual({
        success: true,
        code: 200,
        message: 'Manual schedule completed successfully in 2.5s',
        targetDate: '2025-10-12',
        stats: { saved: 10, updated: 5, errors: 0, total: 15 },
      });
    });

    it('should handle manual schedule failure', async () => {
      const mockResult = {
        success: false,
        message: 'Manual schedule failed :( : API Error',
        targetDate: '2025-10-12',
      };
      schedulerService.triggerManualSchedule.mockResolvedValue(mockResult);

      const result = await controller.triggerManualSchedule();

      expect(result).toEqual({
        success: false,
        code: 500,
        message: 'Manual schedule failed :( : API Error',
        targetDate: '2025-10-12',
        stats: undefined,
      });
    });
  });

  describe('getSchedulerLogs', () => {
    it('should return log file content', () => {
      const mockLogContent = '2025-08-13 06:00:01 - [START] Daily schedule job started';
      schedulerLogger.readLogFile.mockReturnValue(mockLogContent);

      const result = controller.getSchedulerLogs();

      expect(result).toBe(mockLogContent);
      expect(schedulerLogger.readLogFile).toHaveBeenCalled();
    });

    it('should return no logs message', () => {
      schedulerLogger.readLogFile.mockReturnValue('No logs available yet.');

      const result = controller.getSchedulerLogs();

      expect(result).toBe('No logs available yet.');
    });
  });
});