import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { HistoryComponent } from './history.component';
import { CacheService } from '../core/services';
import { AuthService } from '../core/auth/auth.service';
import { EventService } from '../events/event.service';
import { Event } from '../models/event.model';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let mockCacheService: jasmine.SpyObj<CacheService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: any;

  const mockEvents: Event[] = [
    {
      _id: '1',
      ticketmasterId: 'tm1',
      name: 'Event 1',
      url: 'url1',
      date: { localDate: '2025-01-01' },
      venue: { name: 'Venue 1', city: 'Paris' },
      segment: 'Music',
      syncedAt: '2025-01-01',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      _id: '2',
      ticketmasterId: 'tm2',
      name: 'Event 2 avec un titre très long qui doit être tronqué',
      url: 'url2',
      date: { localDate: '2025-02-01' },
      venue: { name: 'Venue 2', city: 'Lyon' },
      segment: 'Sport',
      syncedAt: '2025-01-01',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  beforeEach(async () => {
    mockCacheService = jasmine.createSpyObj('CacheService', [
      'getViewHistory',
      'clearViewHistory',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'events']);

    mockAuthService = {
      isAuthenticated$: of(true),
    };

    (mockRouter as any).events = of({});

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        { provide: CacheService, useValue: mockCacheService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        EventService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;

    // Setup default mock returns
    mockCacheService.getViewHistory.and.returnValue(mockEvents);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load history on init', () => {
    fixture.detectChanges();

    expect(mockCacheService.getViewHistory).toHaveBeenCalled();
    expect(component.history()).toEqual(mockEvents);
  });

  it('should navigate to event when clicked', () => {
    fixture.detectChanges();

    component.navigateToEvent(mockEvents[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/event', '1']);
  });

  it('should use ticketmasterId when _id is not available', () => {
    const eventWithoutId = { ...mockEvents[0], _id: undefined };

    component.navigateToEvent(eventWithoutId);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/event', 'tm1']);
  });

  it('should clear history', () => {
    mockCacheService.getViewHistory.and.returnValue([]);

    component.clearHistory();

    expect(mockCacheService.clearViewHistory).toHaveBeenCalled();
    expect(component.history()).toEqual([]);
  });

  it('should not truncate short text', () => {
    const shortText = 'Short text';
    const result = component.truncateText(shortText, 25);

    expect(result).toBe('Short text');
  });

  it('should reload history when auth changes', () => {
    mockCacheService.getViewHistory.calls.reset();

    fixture.detectChanges();

    // Auth change triggers reload
    mockAuthService.isAuthenticated$ = of(false);
    fixture.detectChanges();

    expect(mockCacheService.getViewHistory).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();

    const routerSub = component['routerSubscription'];
    const authSub = component['authSubscription'];

    spyOn(routerSub!, 'unsubscribe');
    spyOn(authSub!, 'unsubscribe');

    component.ngOnDestroy();

    expect(routerSub!.unsubscribe).toHaveBeenCalled();
    expect(authSub!.unsubscribe).toHaveBeenCalled();
  });

  it('should delegate formatting to EventService', () => {
    fixture.detectChanges();
    const eventService = component['eventService'];
    spyOn(eventService, 'getEventTitle').and.returnValue('Test Title');
    spyOn(eventService, 'getEventImage').and.returnValue('test-image.jpg');
    spyOn(eventService, 'getEventLocation').and.returnValue('Test Location');
    spyOn(eventService, 'formatDate').and.returnValue('Test Date');

    component.getEventTitle(mockEvents[0]);
    expect(eventService.getEventTitle).toHaveBeenCalledWith(mockEvents[0]);

    component.getEventImage(mockEvents[0]);
    expect(eventService.getEventImage).toHaveBeenCalledWith(mockEvents[0]);

    component.getEventLocation(mockEvents[0]);
    expect(eventService.getEventLocation).toHaveBeenCalledWith(mockEvents[0]);

    component.formatDate(mockEvents[0]);
    expect(eventService.formatDate).toHaveBeenCalledWith(mockEvents[0].date);
  });
});
