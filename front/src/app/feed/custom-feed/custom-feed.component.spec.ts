import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomFeedComponent } from './custom-feed.component';
import { CustomFeedService } from './custom-feed.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfigService } from '../../core/services';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('CustomFeedComponent', () => {
  let component: CustomFeedComponent;
  let fixture: ComponentFixture<CustomFeedComponent>;
  let customFeedService: jasmine.SpyObj<CustomFeedService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const customFeedServiceSpy = jasmine.createSpyObj('CustomFeedService', [
      'getCustomFeed',
      'getCustomCachedEvents',
      'clearCustomEventsCache'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserPreferences']);

    await TestBed.configureTestingModule({
      imports: [CustomFeedComponent, HttpClientTestingModule],
      providers: [
        { provide: CustomFeedService, useValue: customFeedServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        ConfigService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomFeedComponent);
    component = fixture.componentInstance;
    customFeedService = TestBed.inject(CustomFeedService) as jasmine.SpyObj<CustomFeedService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load events on init', () => {
    const mockEvent = {
      _id: '1',
      ticketmasterId: 'tm1',
      name: 'Event 1',
      url: 'http://example.com',
      date: { localDate: '2025-08-20', localTime: '20:00:00' },
      segment: 'Music',
      genre: 'Rock',
      subGenre: 'Alternative',
      status: 'onsale',
      venue: { name: 'Test Venue', city: 'Test City' },
      priceRanges: [],
      images: [],
      syncedAt: '2025-08-19T10:00:00Z',
      createdAt: '2025-08-19T10:00:00Z',
      updatedAt: '2025-08-19T10:00:00Z'
    };

    const mockResponse = {
      success: true,
      code: 200,
      message: 'Feed récupéré',
      data: {
        events: [mockEvent],
        pagination: {
          total: 1,
          page: 1,
          limit: 30,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    };

    customFeedService.getCustomCachedEvents.and.returnValue(null);
    customFeedService.getCustomFeed.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(customFeedService.getCustomFeed).toHaveBeenCalledWith(1, 30);
    expect(component.events()).toEqual(mockResponse.data.events);
  });

  it('should handle no preferences', () => {
    const mockResponse = {
      success: true,
      code: 200,
      message: 'Aucune préférence',
      data: {
        events: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 30,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    };

    customFeedService.getCustomCachedEvents.and.returnValue(null);
    customFeedService.getCustomFeed.and.returnValue(of(mockResponse));

    component.ngOnInit();

    expect(component.events()).toEqual([]);
    expect(component.totalCount()).toBe(0);
  });

  it('should handle errors', () => {
    customFeedService.getCustomCachedEvents.and.returnValue(null);
    customFeedService.getCustomFeed.and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Erreur serveur' } }))
    );

    component.ngOnInit();

    expect(component.error()).toBeTruthy();
    expect(component.events()).toEqual([]);
  });
});