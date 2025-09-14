import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PublicFeedService } from './public-feed.service';
import { ConfigService } from '../../core/services/config.service';
import { CacheService } from '../../core/services/cache.service';
import { Event } from '../../models/event.model';

describe('PublicFeedService', () => {
  let service: PublicFeedService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;
  let cacheService: jasmine.SpyObj<CacheService>;
  let mockEvents: Event[];
  let mockResponse: any;

  beforeEach(() => {
    const configSpy = jasmine.createSpyObj('ConfigService', ['getApiEndpoint']);
    const cacheSpy = jasmine.createSpyObj('CacheService', ['get', 'set', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        PublicFeedService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: configSpy },
        { provide: CacheService, useValue: cacheSpy }
      ]
    });

    service = TestBed.inject(PublicFeedService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
    cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;

    mockEvents = [
      {
        _id: '1',
        ticketmasterId: 'tm1',
        name: 'Event 1',
        url: 'https://test1.com',
        date: { localDate: '2025-08-20' },
        segment: 'Music',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      },
      {
        _id: '2',
        ticketmasterId: 'tm2',
        name: 'Event 2',
        url: 'https://test2.com',
        date: { localDate: '2025-08-21' },
        segment: 'Sports',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01'
      }
    ] as Event[];

    mockResponse = {
      success: true,
      code: 200,
      message: 'Events retrieved successfully',
      data: {
        events: mockEvents,
        totalCount: 2,
        currentPage: 1,
        totalPages: 1
      }
    };

    configService.getApiEndpoint.and.returnValue('http://localhost:3001/feed/public');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPublicFeed', () => {
    it('should return cached data when available (cache hit)', () => {
      const cachedPage = {
        events: mockEvents,
        pagination: {
          total: 2,
          page: 1,
          limit: 30,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      cacheService.get.and.returnValue(mockEvents);

      service.getPublicFeed(1, 30).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(cachedPage);
      });

      expect(cacheService.get).toHaveBeenCalledWith('public_events');
      expect(configService.getApiEndpoint).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache miss and cache the result', () => {
      const cachedPageAfterFetch = {
        events: mockEvents,
        pagination: {
          total: 2,
          page: 1,
          limit: 30,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      // First call returns null (cache miss), second call returns cached data
      cacheService.get.and.returnValues(null, mockEvents);

      service.getPublicFeed(1, 30).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(cachedPageAfterFetch);
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/public');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(configService.getApiEndpoint).toHaveBeenCalledWith('/feed/public');
      expect(cacheService.set).toHaveBeenCalledWith('public_events', mockEvents, 15);
    });

    it('should use default page and limit values', () => {
      cacheService.get.and.returnValue(mockEvents);

      service.getPublicFeed().subscribe(response => {
        expect(response.success).toBe(true);
      });

      expect(cacheService.get).toHaveBeenCalledWith('public_events');
    });


    it('should return original response when API response is unsuccessful', () => {
      const errorResponse = {
        success: false,
        code: 500,
        message: 'Internal Server Error',
        data: null
      };

      cacheService.get.and.returnValue(null);

      service.getPublicFeed(1, 30).subscribe(response => {
        expect(response).toEqual(errorResponse);
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/public');
      req.flush(errorResponse);

      expect(cacheService.set).not.toHaveBeenCalled();
    });



    it('should handle API response with empty events array', () => {
      const responseWithEmptyEvents = {
        success: true,
        code: 200,
        message: 'Events retrieved successfully',
        data: {
          events: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0
        }
      };

      cacheService.get.and.returnValue(null);

      service.getPublicFeed(1, 30).subscribe(response => {
        expect(response).toEqual(responseWithEmptyEvents);
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/public');
      req.flush(responseWithEmptyEvents);

      expect(cacheService.set).toHaveBeenCalledWith('public_events', [], 15);
    });


  });

  describe('getGenreCounts', () => {
    it('should return cached genre counts when available', () => {
      const mockCounts = { 'Rock': 15, 'Football': 25, 'Jazz': 8 };
      cacheService.get.and.returnValue(mockCounts);

      service.getGenreCounts().subscribe(counts => {
        expect(counts).toEqual(mockCounts);
      });

      expect(cacheService.get).toHaveBeenCalledWith('genre_counts');
      expect(configService.getApiEndpoint).not.toHaveBeenCalled();
    });

    it('should fetch genre counts from API when cache miss', () => {
      const mockCounts = { 'Rock': 15, 'Football': 25, 'Jazz': 8 };
      const apiResponse = {
        success: true,
        data: mockCounts
      };

      cacheService.get.and.returnValue(null);
      configService.getApiEndpoint.and.returnValue('http://localhost:3001/feed/genre-counts');

      service.getGenreCounts().subscribe(counts => {
        expect(counts).toEqual(mockCounts);
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/genre-counts');
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);

      expect(cacheService.set).toHaveBeenCalledWith('genre_counts', mockCounts, 5);
    });

    it('should return empty object when API response is unsuccessful', () => {
      const apiResponse = {
        success: false,
        data: null
      };

      cacheService.get.and.returnValue(null);
      configService.getApiEndpoint.and.returnValue('http://localhost:3001/feed/genre-counts');

      service.getGenreCounts().subscribe(counts => {
        expect(counts).toEqual({});
      });

      const req = httpMock.expectOne('http://localhost:3001/feed/genre-counts');
      req.flush(apiResponse);

      expect(cacheService.set).toHaveBeenCalledWith('genre_counts', {}, 5);
    });
  });

  describe('getSegments', () => {
    it('should return predefined segments', () => {
      const segments = service.getSegments();

      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);
      
      // Verify segments structure
      segments.forEach(segment => {
        expect(segment.id).toBeDefined();
        expect(segment.name).toBeDefined();
        expect(segment.label).toBeDefined();
      });
    });

    it('should include expected segments', () => {
      const segments = service.getSegments();
      const segmentNames = segments.map(s => s.name);

      expect(segmentNames).toContain('Musique');
      expect(segmentNames).toContain('Sports');
    });
  });

  describe('cache management', () => {
    it('should clear public events cache', () => {
      service.clearPublicEventsCache();
      expect(cacheService.clear).toHaveBeenCalledWith('public_events');
    });

    it('should clear genre counts cache', () => {
      service.clearGenreCountsCache();
      expect(cacheService.clear).toHaveBeenCalledWith('genre_counts');
    });

    it('should get cached public events', () => {
      const cachedEvents = [mockEvents[0]];
      cacheService.get.and.returnValue(cachedEvents);

      const result = service.getPublicCachedEvents();
      
      expect(result).toEqual(cachedEvents);
      expect(cacheService.get).toHaveBeenCalledWith('public_events');
    });
  });
});