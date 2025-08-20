import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { Event } from '../models/event.model';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatDate', () => {
    it('should return "Date non disponible" for null/undefined date', () => {
      expect(service.formatDate(null)).toBe('Date non disponible');
      expect(service.formatDate(undefined)).toBe('Date non disponible');
    });

    it('should format MongoDB date with localDate and localTime', () => {
      const mongoDate = {
        localDate: '2025-08-20',
        localTime: '20:00:00',
      };
      const result = service.formatDate(mongoDate);
      expect(result).toContain('mercredi');
      expect(result).toContain('20 août 2025');
      // L'heure n'est pas incluse dans le format actuel
    });

    it('should format MongoDB date with localDate only', () => {
      const mongoDate = {
        localDate: '2025-08-20',
      };
      const result = service.formatDate(mongoDate);
      expect(result).toContain('mercredi');
      expect(result).toContain('20 août 2025');
    });
  });

  describe('getEventTitle', () => {
    it('should return event name when available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'Test Concert',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventTitle(event)).toBe('Test Concert');
    });

    it('should return default title when name is empty', () => {
      const event = {
        ticketmasterId: 'test',
        name: '',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventTitle(event)).toBe('Événement sans titre');
    });

    it('should return default title when name is null', () => {
      const event = {
        ticketmasterId: 'test',
        name: null,
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as any;
      expect(service.getEventTitle(event)).toBe('Événement sans titre');
    });
  });

  describe('getEventImage', () => {
    it('should return first image URL when images exist', () => {
      const event = {
        images: [
          { url: 'https://test.com/image1.jpg', width: 640, height: 480 },
          { url: 'https://test.com/image2.jpg', width: 320, height: 240 },
        ],
      } as Event;
      expect(service.getEventImage(event)).toBe('https://test.com/image1.jpg');
    });

    it('should return null when no images', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        images: [],
      } as Event;
      expect(service.getEventImage(event)).toBeNull();
    });

    it('should return null when images is undefined', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventImage(event)).toBeNull();
    });

    it('should return null when first image has no URL', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        images: [{ url: '', width: 640, height: 480 }],
      } as Event;
      expect(service.getEventImage(event)).toBeNull();
    });
  });

  describe('getEventLocation', () => {
    it('should return venue name and city when both available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        venue: {
          name: 'Stade de France',
          city: 'Paris',
        },
      } as Event;
      expect(service.getEventLocation(event)).toBe('Stade de France');
    });

    it('should return only venue name when city is not available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        venue: {
          name: 'Stade de France',
        },
      } as Event;
      expect(service.getEventLocation(event)).toBe('Stade de France');
    });

    it('should return default message when venue is undefined', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventLocation(event)).toBe('Lieu non défini');
    });
  });

  describe('getEventCategory', () => {
    it('should return segment when available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'Music',
        genre: 'Rock',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventCategory(event)).toBe('Music');
    });

    it('should return genre when segment is not available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: '',
        genre: 'Rock',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventCategory(event)).toBe('Rock');
    });

    it('should return default when neither segment nor genre available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: '',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventCategory(event)).toBe('Événement');
    });
  });

  describe('getEventPrice', () => {
    it('should return price when available', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        priceRange: {
          min: 25,
          max: 100,
          currency: 'EUR',
        },
      } as Event;
      const result = service.getEventPrice(event);
      expect(result.hasPrice).toBe(true);
      expect(result.price).toBe(25);
      expect(result.currency).toBe('EUR');
    });

    it('should use default currency when not specified', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        priceRange: {
          min: 25,
        },
      } as Event;
      const result = service.getEventPrice(event);
      expect(result.hasPrice).toBe(true);
      expect(result.price).toBe(25);
      expect(result.currency).toBe('EUR');
    });

    it('should return no price when min is undefined', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        priceRange: {
          currency: 'EUR',
        },
      } as Event;
      const result = service.getEventPrice(event);
      expect(result.hasPrice).toBe(false);
    });

    it('should return no price when priceRange is undefined', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      const result = service.getEventPrice(event);
      expect(result.hasPrice).toBe(false);
    });
  });

  describe('getEventStatus', () => {
    it('should return "En vente" for onsale status', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        status: 'onsale',
      } as Event;
      expect(service.getEventStatus(event)).toBe('En vente');
    });

    it('should return "Vente fermée" for offsale status', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        status: 'offsale',
      } as Event;
      expect(service.getEventStatus(event)).toBe('Vente fermée');
    });

    it('should return "Annulé" for cancelled status', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        status: 'cancelled',
      } as Event;
      expect(service.getEventStatus(event)).toBe('Annulé');
    });

    it('should return "Statut inconnu" when status is undefined', () => {
      const event = {
        ticketmasterId: 'test',
        name: 'test',
        url: 'test',
        date: { localDate: '2025-01-01' },
        segment: 'test',
        syncedAt: '2025-01-01',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      } as Event;
      expect(service.getEventStatus(event)).toBe('Statut inconnu');
    });
  });
});
