import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerLoggerService } from './scheduler-logger.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('SchedulerLoggerService', () => {
  let service: SchedulerLoggerService;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulerLoggerService],
    }).compile();

    service = module.get<SchedulerLoggerService>(SchedulerLoggerService);
    jest.clearAllMocks();
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logJobStart', () => {
    it('should log job start', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.appendFileSync.mockImplementation();

      const targetDate = new Date('2025-10-12');
      service.logJobStart(targetDate);

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[START] Daily schedule job started for date: 2025-10-12'),
        'utf8'
      );
    });
  });

  describe('logJobSuccess', () => {
    it('should log job success with stats', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.appendFileSync.mockImplementation();

      service.logJobSuccess(10, 5, 0, 2500);

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[SUCCESS] Events synced: 10 saved, 5 updated, 0 errors'),
        'utf8'
      );
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[END] Job completed in 2.5s'),
        'utf8'
      );
    });
  });

  describe('logJobError', () => {
    it('should log job error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.appendFileSync.mockImplementation();

      const error = new Error('Test error');
      service.logJobError(error, 1000);

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[ERROR] Test error'),
        'utf8'
      );
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('[END] Job failed after 1.0s'),
        'utf8'
      );
    });
  });

  describe('readLogFile', () => {
    it('should return log content when file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('test log content');

      const result = service.readLogFile();

      expect(result).toBe('test log content');
    });

    it('should return no logs message when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = service.readLogFile();

      expect(result).toBe('No logs available yet.');
    });

    it('should handle read errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = service.readLogFile();

      expect(result).toBe('Error reading log file: Read error');
    });
  });
});