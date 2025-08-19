import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { CustomFeedService } from './custom-feed.service';
import { ConfigService } from '../../core/services/config.service';
import { CacheService } from '../../core/services/cache.service';
import { AuthService } from '../../core/auth/auth.service';
import { HttpHeaders } from '@angular/common/http';

describe('CustomFeedService', () => {
  let service: CustomFeedService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;
  let cacheService: jasmine.SpyObj<CacheService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const configServiceSpy = jasmine.createSpyObj('ConfigService', [
      'getApiEndpoint',
    ]);
    const cacheServiceSpy = jasmine.createSpyObj('CacheService', [
      'get',
      'set',
      'clear',
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getAuthHeaders',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CustomFeedService,
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: CacheService, useValue: cacheServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(CustomFeedService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(
      ConfigService
    ) as jasmine.SpyObj<ConfigService>;
    cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get custom feed', () => {
    const mockResponse = {
      success: true,
      code: 200,
      message: 'Success',
      data: {
        events: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
    };

    const headers = new HttpHeaders().set('Authorization', 'Bearer token');
    authService.getAuthHeaders.and.returnValue(headers);
    configService.getApiEndpoint.and.returnValue('http://localhost:3000/feed');
    
    // First call returns null (cache miss), second call returns cached data
    cacheService.get.and.returnValues(null, []);

    service.getCustomFeed(1, 20).subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data.events).toEqual([]);
    });

    const req = httpMock.expectOne('http://localhost:3000/feed');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush(mockResponse);

    expect(cacheService.set).toHaveBeenCalledWith('custom_events', [], 15);
  });
});
