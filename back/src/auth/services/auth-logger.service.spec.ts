import { Test, TestingModule } from '@nestjs/testing';
import { AuthLoggerService, AuthEvent } from './auth-logger.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('AuthLoggerService', () => {
  let service: AuthLoggerService;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthLoggerService],
    }).compile();

    service = module.get<AuthLoggerService>(AuthLoggerService);
    mockFs = fs as jest.Mocked<typeof fs>;
    
    // Mock fs functions
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    (mockFs.appendFile as any).mockImplementation((file: any, data: any, callback: any) => {
      if (typeof callback === 'function') {
        callback(null);
      }
    });
    (mockFs.readFile as any).mockImplementation((file: any, encoding: any, callback: any) => {
      if (typeof callback === 'function') {
        callback(null, '');
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logLoginSuccess', () => {
    it('should log successful login with request info', async () => {
      const mockRequest = { 
        ip: '127.0.0.1', 
        headers: { 'user-agent': 'test-agent' } 
      };

      await service.logLoginSuccess('test@test.com', 1, mockRequest);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"event":"login_success"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"email":"test@test.com"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"userId":1'),
        expect.any(Function)
      );
    });

    it('should handle missing request data gracefully', async () => {
      await service.logLoginSuccess('test@test.com', 1);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"ip":"unknown"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"userAgent":"unknown"'),
        expect.any(Function)
      );
    });
  });

  describe('logLoginFailed', () => {
    it('should log failed login attempt', async () => {
      const mockRequest = { 
        ip: '192.168.1.1', 
        headers: { 'user-agent': 'malicious-agent' } 
      };

      await service.logLoginFailed('test@test.com', 'Invalid credentials', mockRequest);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"event":"login_failed"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"reason":"Invalid credentials"'),
        expect.any(Function)
      );
    });
  });

  describe('logRegisterSuccess', () => {
    it('should log successful registration', async () => {
      const mockRequest = { ip: '10.0.0.1' };

      await service.logRegisterSuccess('newuser', 'new@test.com', 2, mockRequest);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"event":"register_success"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"username":"newuser"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"email":"new@test.com"'),
        expect.any(Function)
      );
    });
  });

  describe('logRateLimitExceeded', () => {
    it('should log rate limit exceeded event', async () => {
      const mockRequest = { 
        ip: 'suspicious.ip.com', 
        headers: { 'user-agent': 'bot-agent' }
      };

      await service.logRateLimitExceeded('/auth/login', mockRequest);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"event":"rate_limit_exceeded"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"/auth/login"'),
        expect.any(Function)
      );
    });
  });

  describe('getRecentFailedAttempts', () => {
    it('should return count of recent failed attempts', async () => {
      const mockLogData = [
        '{"timestamp":"' + new Date().toISOString() + '","event":"login_failed","email":"test@test.com"}',
        '{"timestamp":"' + new Date().toISOString() + '","event":"login_failed","email":"test@test.com"}',
        '{"timestamp":"' + new Date().toISOString() + '","event":"login_success","email":"other@test.com"}'
      ].join('\n');

      (mockFs.readFile as any).mockImplementation((file: any, encoding: any, callback: any) => {
        if (typeof callback === 'function') {
          callback(null, mockLogData);
        }
      });

      const result = await service.getRecentFailedAttempts('test@test.com', 15);

      expect(result).toBe(2);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        'utf8',
        expect.any(Function)
      );
    });

    it('should return 0 when log file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await service.getRecentFailedAttempts('test@test.com', 15);

      expect(result).toBe(0);
    });

    it('should return 0 for email with no failed attempts', async () => {
      const mockLogData = [
        '{"timestamp":"' + new Date().toISOString() + '","event":"login_success","email":"clean@test.com"}'
      ].join('\n');

      (mockFs.readFile as any).mockImplementation((file: any, encoding: any, callback: any) => {
        if (typeof callback === 'function') {
          callback(null, mockLogData);
        }
      });

      const result = await service.getRecentFailedAttempts('clean@test.com', 15);

      expect(result).toBe(0);
    });
  });

  describe('logLogout', () => {
    it('should log successful logout', async () => {
      const mockRequest = { 
        ip: '127.0.0.1', 
        headers: { 'user-agent': 'browser' } 
      };

      await service.logLogout(1, 'test@test.com', mockRequest);

      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('auth-security.log'),
        expect.stringContaining('"event":"logout"'),
        expect.any(Function)
      );
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('"userId":1'),
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should handle file write errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (mockFs.appendFile as any).mockImplementation((file: any, data: any, callback: any) => {
        if (typeof callback === 'function') {
          callback(new Error('Disk full'));
        }
      });

      await expect(service.logLoginSuccess('test@test.com', 1)).rejects.toThrow('Disk full');
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed log entries when reading', async () => {
      const mockLogData = [
        'invalid json line',
        '{"timestamp":"' + new Date().toISOString() + '","event":"login_failed","email":"test@test.com"}'
      ].join('\n');

      (mockFs.readFile as any).mockImplementation((file: any, encoding: any, callback: any) => {
        if (typeof callback === 'function') {
          callback(null, mockLogData);
        }
      });

      const result = await service.getRecentFailedAttempts('test@test.com', 15);

      expect(result).toBe(1); // Should ignore malformed line and count only valid one
    });
  });
});