import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { EventDetailComponent } from './event-detail.component';
import { ConfigService } from '../../core/services';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let httpMock: HttpTestingController;
  let mockActivatedRoute: any;
  let paramMapSubject: Subject<any>;

  const mockEvent: any = {
    _id: 'test-123',
    ticketmasterId: 'tm-123',
    name: 'Concert Test',
    description:
      'Description du concert test qui fait plus de 400 caractères pour tester la troncature. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    url: 'http://test.com',
    venue: {
      name: 'Salle de test',
      city: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
    },
    date: {
      localDate: '2025-12-25',
      localTime: '20:00:00',
    },
    images: [{ url: 'test-image.jpg' }],
    segment: 'Music',
    syncedAt: '2025-01-01',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  beforeEach(async () => {
    paramMapSubject = new Subject();
    mockActivatedRoute = {
      paramMap: paramMapSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent, HttpClientTestingModule],
      providers: [
        ConfigService,
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load event when route params change', () => {
    fixture.detectChanges(); // Subscribe to route params
    paramMapSubject.next({ get: () => 'test-123' });

    const req = httpMock.expectOne('http://localhost:3001/events/test-123');
    expect(req.request.method).toBe('GET');

    req.flush({ success: true, data: mockEvent });

    expect(component.event()).toEqual(mockEvent);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle event loading error', () => {
    fixture.detectChanges(); // Subscribe to route params
    paramMapSubject.next({ get: () => 'invalid-id' });

    const req = httpMock.expectOne('http://localhost:3001/events/invalid-id');
    req.flush({ success: false }, { status: 404, statusText: 'Not Found' });

    expect(component.event()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe("Impossible de charger l'événement");
  });

  it('should truncate long descriptions', () => {
    component.event.set(mockEvent);

    expect(component.shouldTruncateDescription()).toBe(true);
    expect(component.getDisplayedDescription().length).toBeLessThanOrEqual(392);

    component.toggleDescription();
    expect(component.isDescriptionExpanded()).toBe(true);
    expect(component.getDisplayedDescription()).toBe(mockEvent.description);
  });

  it('should add event to history on destroy', () => {
    const cacheService = (component as any).cacheService;
    spyOn(cacheService, 'addToViewHistory');

    component.event.set(mockEvent);
    component.ngOnDestroy();

    expect(cacheService.addToViewHistory).toHaveBeenCalledWith(mockEvent);
  });

  it('should navigate back to home', () => {
    const router = (component as any).router;
    spyOn(router, 'navigate');

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
