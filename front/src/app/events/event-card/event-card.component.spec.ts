import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { EventCardComponent } from './event-card.component';
import { Event } from '../../models/event.model';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  const mockEvent: Event = {
    _id: '123',
    ticketmasterId: 'tm123',
    name: 'Test Event',
    description: 'Test Description',
    url: 'https://test.com',
    images: [{
      url: 'https://test.com/image.jpg',
      width: 640,
      height: 480
    }],
    date: {
      localDate: '2025-08-20',
      localTime: '20:00:00',
      dateTime: '2025-08-20T18:00:00Z'
    },
    venue: {
      name: 'Test Venue',
      city: 'Test City',
      country: 'Test Country',
      address: 'Test Address'
    },
    segment: 'Music',
    genre: 'Rock',
    priceRange: {
      currency: 'EUR',
      min: 10,
      max: 100
    },
    status: 'onsale',
    syncedAt: '2025-08-18T00:00:00Z',
    createdAt: '2025-08-18T00:00:00Z',
    updatedAt: '2025-08-18T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    component.event = mockEvent;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display event data correctly', () => {
    expect(component.getEventTitle()).toBe('Test Event');
    expect(component.getEventLocation()).toContain('Test Venue');
  });

  describe('formatDate', () => {
    it('should call eventCardService.formatDate', () => {
      const spy = spyOn(component['EventService'], 'formatDate').and.returnValue('Formatted Date');
      const result = component.formatDate(mockEvent.date);
      expect(spy).toHaveBeenCalledWith(mockEvent.date);
      expect(result).toBe('Formatted Date');
    });
  });

  describe('getEventTitle', () => {
    it('should call eventCardService.getEventTitle with current event', () => {
      const spy = spyOn(component['EventService'], 'getEventTitle').and.returnValue('Service Title');
      const result = component.getEventTitle();
      expect(spy).toHaveBeenCalledWith(component.event);
      expect(result).toBe('Service Title');
    });
  });

  describe('getEventImage', () => {
    it('should call eventCardService.getEventImage with current event', () => {
      const spy = spyOn(component['EventService'], 'getEventImage').and.returnValue('test-image.jpg');
      const result = component.getEventImage();
      expect(spy).toHaveBeenCalledWith(component.event);
      expect(result).toBe('test-image.jpg');
    });
  });

  describe('getEventLocation', () => {
    it('should call eventCardService.getEventLocation with current event', () => {
      const spy = spyOn(component['EventService'], 'getEventLocation').and.returnValue('Service Location');
      const result = component.getEventLocation();
      expect(spy).toHaveBeenCalledWith(component.event);
      expect(result).toBe('Service Location');
    });
  });

  describe('getEventCategory', () => {
    it('should call eventCardService.getEventCategory with current event', () => {
      const spy = spyOn(component['EventService'], 'getEventCategory').and.returnValue('Service Category');
      const result = component.getEventCategory();
      expect(spy).toHaveBeenCalledWith(component.event);
      expect(result).toBe('Service Category');
    });
  });
});
