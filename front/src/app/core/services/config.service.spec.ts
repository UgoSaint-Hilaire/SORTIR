import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('production', () => {
    it('should return production flag from environment', () => {
      const production = service.production;
      expect(typeof production).toBe('boolean');
      expect(production).toBe(false); // In test environment, production should be false
    });
  });

  describe('apiUrl', () => {
    it('should return apiUrl from environment', () => {
      const apiUrl = service.apiUrl;
      expect(typeof apiUrl).toBe('string');
      expect(apiUrl).toBe('http://localhost:3001');
    });
  });

  describe('getApiEndpoint', () => {
    it('should concatenate apiUrl with endpoint', () => {
      const endpoint = '/feed/public';
      const result = service.getApiEndpoint(endpoint);
      expect(result).toBe('http://localhost:3001/feed/public');
    });

    it('should handle endpoints without leading slash', () => {
      const endpoint = 'users';
      const result = service.getApiEndpoint(endpoint);
      expect(result).toBe('http://localhost:3001users');
    });

    it('should handle empty endpoint', () => {
      const endpoint = '';
      const result = service.getApiEndpoint(endpoint);
      expect(result).toBe('http://localhost:3001');
    });

    it('should handle endpoint with query parameters', () => {
      const endpoint = '/events?page=1&limit=10';
      const result = service.getApiEndpoint(endpoint);
      expect(result).toBe('http://localhost:3001/events?page=1&limit=10');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return "development" when production is false', () => {
      const result = service.getEnvironmentInfo();
      expect(result).toBe('development');
    });

    it('should return "production" when production is true', () => {
      // Mock the private config property to simulate production environment
      (service as any).config = { production: true, apiUrl: 'https://api.example.com' };
      const result = service.getEnvironmentInfo();
      expect(result).toBe('production');
    });
  });
});