import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ExplorerFeedService } from './explorer-feed.service';
import { ConfigService, CacheService } from '../../core/services';

describe('ExplorerFeedService', () => {
  let service: ExplorerFeedService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;
  let cacheService: jasmine.SpyObj<CacheService>;

  const mockResponse = {
    success: true,
    data: {
      events: [
        {
          _id: '1',
          name: 'Test Event 1',
          segment: 'Musique',
          genre: 'Rock'
        },
        {
          _id: '2',
          name: 'Test Event 2',
          segment: 'Sports',
          genre: 'Football'
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 30,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  };

  beforeEach(() => {
    const configSpy = jasmine.createSpyObj('ConfigService', ['getApiEndpoint']);
    const cacheSpy = jasmine.createSpyObj('CacheService', ['get', 'set', 'clear']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ConfigService, useValue: configSpy },
        { provide: CacheService, useValue: cacheSpy }
      ]
    });
    
    service = TestBed.inject(ExplorerFeedService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;

    configService.getApiEndpoint.and.returnValue('http://localhost:3001/feed/all');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllEventsFeed', () => {
    it('should return cached data when available', () => {
      const cachedData = mockResponse.data;
      cacheService.get.and.returnValue(cachedData);

      service.getAllEventsFeed(1, 30).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(cachedData);
      });

      expect(cacheService.get).toHaveBeenCalled();
      expect(configService.getApiEndpoint).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache miss', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should include segments in request params', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30, ['Musique', 'Sports']).subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30&segments=Musique,Sports');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include genres in request params', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30, undefined, ['Rock', 'Football']).subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30&genres=Football,Rock');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include legacy genre parameter', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30, undefined, undefined, 'Rock').subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30&genre=Rock');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include all filters in request params', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(2, 15, ['Musique'], ['Rock'], 'Jazz').subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=2&limit=15&segments=Musique&genres=Rock&genre=Jazz');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('cache management', () => {
    it('should clear specific cache', () => {
      service.clearCache(['Musique'], ['Rock']);
      
      expect(cacheService.clear).toHaveBeenCalledWith('explorer_events_Musique_Rock_');
    });

    it('should clear cache for all segments', () => {
      service.clearCache();
      
      expect(cacheService.clear).toHaveBeenCalledWith('explorer_events_all_all_');
    });

    it('should clear all cache combinations', () => {
      service.clearAllCache();
      
      expect(cacheService.clear).toHaveBeenCalledTimes(8);
      expect(cacheService.clear).toHaveBeenCalledWith('explorer_events_all_all_');
    });

    it('should generate correct cache key for multiple segments', () => {
      service.clearCache(['Sports', 'Musique']);
      
      // Les segments doivent être triés dans la clé de cache
      expect(cacheService.clear).toHaveBeenCalledWith('explorer_events_Musique_Sports_all_');
    });

    it('should generate correct cache key for multiple genres', () => {
      service.clearCache(undefined, ['Jazz', 'Rock']);
      
      // Les genres doivent être triés dans la clé de cache
      expect(cacheService.clear).toHaveBeenCalledWith('explorer_events_all_Jazz_Rock_');
    });
  });

  describe('caching behavior', () => {
    it('should not cache unsuccessful responses', () => {
      const errorResponse = { success: false, message: 'Error' };
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30).subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30');
      req.flush(errorResponse);

      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should cache successful responses with events', () => {
      cacheService.get.and.returnValue(null);

      service.getAllEventsFeed(1, 30, ['Musique']).subscribe();

      const req = httpMock.expectOne('http://localhost:3001/feed/all?page=1&limit=30&segments=Musique');
      req.flush(mockResponse);

      expect(cacheService.set).toHaveBeenCalledWith(
        'explorer_events_Musique_all_',
        mockResponse.data,
        10
      );
    });
  });
});
