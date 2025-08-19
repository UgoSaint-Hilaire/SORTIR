import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { PublicFeedComponent } from './public-feed.component';
import { PublicFeedService } from './public-feed.service';
import { Event } from '../../models/event.model';

describe('PublicFeedComponent', () => {
  let component: PublicFeedComponent;
  let fixture: ComponentFixture<PublicFeedComponent>;
  let publicFeedService: jasmine.SpyObj<PublicFeedService>;
  let mockEvents: Event[];
  let mockResponse: any;

  beforeEach(async () => {
    const publicFeedSpy = jasmine.createSpyObj('PublicFeedService', [
      'getPublicFeed',
      'getPublicCachedEvents',
      'clearPublicEventsCache',
    ]);

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
        updatedAt: '2025-01-01',
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
        updatedAt: '2025-01-01',
      },
    ] as Event[];

    mockResponse = {
      success: true,
      data: {
        events: mockEvents,
        pagination: {
          page: 1,
          limit: 30,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [PublicFeedComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PublicFeedService, useValue: publicFeedSpy },
      ],
    }).compileComponents();

    publicFeedService = TestBed.inject(
      PublicFeedService
    ) as jasmine.SpyObj<PublicFeedService>;

    // Setup default behavior
    publicFeedService.getPublicFeed.and.returnValue(of(mockResponse));
    publicFeedService.getPublicCachedEvents.and.returnValue(mockEvents);

    fixture = TestBed.createComponent(PublicFeedComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.events()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(null);
      expect(component.currentPage()).toBe(1);
      expect(component.totalPages()).toBe(1);
      expect(component.totalCount()).toBe(0);
      expect(component.isLoadingMore()).toBe(false);
      expect(component.hasAllEventsLoaded()).toBe(false);
    });
  });

  describe('loadInitialEvents', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load events successfully', () => {
      expect(component.events()).toEqual(mockEvents);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(null);
      expect(component.currentPage()).toBe(1);
      expect(component.totalPages()).toBe(1);
      expect(component.totalCount()).toBe(2);
      expect(component.hasAllEventsLoaded()).toBe(true);
    });

    it('should handle API error response', () => {
      const errorResponse = {
        success: false,
        message: 'API Error',
      };

      publicFeedService.getPublicFeed.and.returnValue(of(errorResponse));
      component['loadInitialEvents']();

      expect(component.events()).toEqual([]);
      expect(component.error()).toBe('API Error');
      expect(component.loading()).toBe(false);
    });

    it('should handle HTTP error', () => {
      const httpError = {
        error: { message: 'Network error' },
      };

      publicFeedService.getPublicFeed.and.returnValue(throwError(httpError));
      component['loadInitialEvents']();

      expect(component.events()).toEqual([]);
      expect(component.error()).toBe('Network error');
      expect(component.loading()).toBe(false);
    });
  });

  describe('loadNextPage', () => {
    beforeEach(() => {
      // Setup component with multiple pages
      const multiPageResponse = {
        success: true,
        data: {
          events: mockEvents,
          pagination: {
            page: 1,
            limit: 30,
            total: 60,
            totalPages: 2,
            hasNext: true,
            hasPrev: false,
          },
        },
      };

      publicFeedService.getPublicFeed.and.returnValue(of(multiPageResponse));
      fixture.detectChanges();
    });

    it('should load next page successfully', () => {
      const page2Events = [
        {
          _id: '3',
          ticketmasterId: 'tm3',
          name: 'Event 3',
          url: 'https://test3.com',
          date: { localDate: '2025-08-22' },
          segment: 'Arts',
          syncedAt: '2025-01-01',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ] as Event[];

      const page2Response = {
        success: true,
        data: {
          events: page2Events,
          pagination: {
            page: 2,
            limit: 30,
            total: 60,
            totalPages: 2,
            hasNext: false,
            hasPrev: true,
          },
        },
      };

      publicFeedService.getPublicFeed.and.returnValue(of(page2Response));

      component['loadNextPage']();

      expect(component.events().length).toBe(3); // 2 initial + 1 new
      expect(component.currentPage()).toBe(2);
      expect(component.isLoadingMore()).toBe(false);
    });

    it('should not load if already at last page', () => {
      // Set to last page
      component.currentPage.set(2);
      component.totalPages.set(2);

      // Reset the existing spy
      publicFeedService.getPublicFeed.calls.reset();
      component['loadNextPage']();

      expect(publicFeedService.getPublicFeed).not.toHaveBeenCalled();
    });

    it('should not load if already loading', () => {
      component.isLoadingMore.set(true);

      // Reset the existing spy
      publicFeedService.getPublicFeed.calls.reset();
      component['loadNextPage']();

      expect(publicFeedService.getPublicFeed).not.toHaveBeenCalled();
    });

    it('should handle error when loading next page', () => {
      const error = { message: 'Network error' };
      publicFeedService.getPublicFeed.and.returnValue(throwError(error));

      component['loadNextPage']();

      expect(component.isLoadingMore()).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should clear cache and reload initial events', () => {
      spyOn(component as any, 'loadInitialEvents');

      component.currentPage.set(2);
      component.hasAllEventsLoaded.set(true);

      component.refresh();

      expect(publicFeedService.clearPublicEventsCache).toHaveBeenCalled();
      expect(component.currentPage()).toBe(1);
      expect(component.hasAllEventsLoaded()).toBe(false);
      expect(component['loadInitialEvents']).toHaveBeenCalled();
    });
  });

  describe('scroll handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trigger loadNextPage when scrolling near bottom', () => {
      // Setup multi-page scenario
      component.currentPage.set(1);
      component.totalPages.set(2);
      component.isLoadingMore.set(false);

      spyOn(component as any, 'loadNextPage');

      // Mock scroll position near bottom (95%)
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(window, 'scrollY', {
        value: 900,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 50,
        configurable: true,
      });

      // Trigger scroll event
      component['scrollHandler']!();

      expect(component['loadNextPage']).toHaveBeenCalled();
    });

    it('should not trigger loadNextPage when not at bottom', () => {
      spyOn(component as any, 'loadNextPage');

      // Mock scroll position not at bottom
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1000,
        configurable: true,
      });
      Object.defineProperty(window, 'scrollY', {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 50,
        configurable: true,
      });

      component['scrollHandler']!();

      expect(component['loadNextPage']).not.toHaveBeenCalled();
    });

    it('should remove scroll listener', () => {
      spyOn(window, 'removeEventListener');

      component['removeScrollListener']();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        jasmine.any(Function)
      );
    });

    it('should handle removeScrollListener when no handler exists', () => {
      component['scrollHandler'] = undefined;

      expect(() => component['removeScrollListener']()).not.toThrow();
    });
  });
});
