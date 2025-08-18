import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';
import { Event } from '../../models/event.model';

describe('CacheService', () => {
  let service: CacheService;
  let mockEvents: Event[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);

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
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const testData = { message: 'test' };
      service.set('test_key', testData, 5);

      const result = service.get('test_key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non_existent');
      expect(result).toBeNull();
    });

    it('should update eventsLoaded signal when setting public_events', () => {
      expect(service.eventsLoaded()).toBe(false);

      service.set('public_events', mockEvents, 15);
      expect(service.eventsLoaded()).toBe(true);
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired data', () => {
      service.set('test_key', 'test_data', 5);
      expect(service.has('test_key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(service.has('non_existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear specific key', () => {
      service.set('key1', 'data1', 5);
      service.set('key2', 'data2', 5);

      service.clear('key1');

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBe('data2');
    });

    it('should clear all keys when no key specified', () => {
      service.set('key1', 'data1', 5);
      service.set('key2', 'data2', 5);

      service.clear();

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
    });

    it('should update eventsLoaded signal when clearing public_events', () => {
      service.set('public_events', mockEvents, 15);
      expect(service.eventsLoaded()).toBe(true);

      service.clear('public_events');
      expect(service.eventsLoaded()).toBe(false);
    });

    it('should update eventsLoaded signal when clearing all', () => {
      service.set('public_events', mockEvents, 15);
      expect(service.eventsLoaded()).toBe(true);

      service.clear();
      expect(service.eventsLoaded()).toBe(false);
    });
  });

  describe('cacheEvents', () => {
    it('should cache events with 15 minutes TTL', () => {
      service.cacheEvents(mockEvents);

      const cached = service.getCachedEvents();
      expect(cached).toEqual(mockEvents);
      expect(service.eventsLoaded()).toBe(true);
    });
  });

  describe('getCachedEvents', () => {
    it('should return cached events', () => {
      service.cacheEvents(mockEvents);
      const result = service.getCachedEvents();
      expect(result).toEqual(mockEvents);
    });

    it('should return null when no events cached', () => {
      const result = service.getCachedEvents();
      expect(result).toBeNull();
    });
  });

  describe('clearEventsCache', () => {
    it('should clear events cache', () => {
      service.cacheEvents(mockEvents);
      expect(service.getCachedEvents()).toEqual(mockEvents);

      service.clearEventsCache();
      expect(service.getCachedEvents()).toBeNull();
      expect(service.eventsLoaded()).toBe(false);
    });
  });

  describe('getEventPage', () => {
    beforeEach(() => {
      const moreEvents: Event[] = [];
      for (let i = 3; i <= 100; i++) {
        moreEvents.push({
          _id: i.toString(),
          ticketmasterId: `tm${i}`,
          name: `Event ${i}`,
          url: `https://test${i}.com`,
          date: { localDate: '2025-08-20' },
          segment: 'Music',
          syncedAt: '2025-01-01',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        } as Event);
      }
      service.cacheEvents([...mockEvents, ...moreEvents]);
    });

    it('should return null when no events cached', () => {
      service.clear();
      const result = service.getEventPage(1, 30);
      expect(result).toBeNull();
    });

    it('should return first page with default limit', () => {
      const result = service.getEventPage(1);

      expect(result).toBeTruthy();
      expect(result!.events.length).toBe(30);
      expect(result!.events[0].name).toBe('Event 1');
      expect(result!.pagination.page).toBe(1);
      expect(result!.pagination.limit).toBe(30);
      expect(result!.pagination.total).toBe(100);
      expect(result!.pagination.totalPages).toBe(4);
      expect(result!.pagination.hasNext).toBe(true);
      expect(result!.pagination.hasPrev).toBe(false);
    });

    it('should return second page with custom limit', () => {
      const result = service.getEventPage(2, 20);

      expect(result).toBeTruthy();
      expect(result!.events.length).toBe(20);
      expect(result!.events[0].name).toBe('Event 21');
      expect(result!.pagination.page).toBe(2);
      expect(result!.pagination.limit).toBe(20);
      expect(result!.pagination.hasNext).toBe(true);
      expect(result!.pagination.hasPrev).toBe(true);
    });

    it('should return last page with fewer items', () => {
      const result = service.getEventPage(4, 30);

      expect(result).toBeTruthy();
      expect(result!.events.length).toBe(10);
      expect(result!.events[0].name).toBe('Event 91');
      expect(result!.pagination.page).toBe(4);
      expect(result!.pagination.hasNext).toBe(false);
      expect(result!.pagination.hasPrev).toBe(true);
    });
  });
});
