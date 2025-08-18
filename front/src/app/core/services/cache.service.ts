import { Injectable, signal } from '@angular/core';
import { Event } from '../../models/event.model';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // le time to live est en millisecondes !!
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  eventsLoaded = signal<boolean>(false);

  set<T>(key: string, data: T, ttlMinutes: number = 15): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };

    this.cache.set(key, entry);

    if (key === 'public_events') {
      this.eventsLoaded.set(true);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);

      if (key === 'public_events') {
        this.eventsLoaded.set(false);
      }

      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);

      if (key === 'public_events') {
        this.eventsLoaded.set(false);
      }
    } else {
      this.cache.clear();
      this.eventsLoaded.set(false);
    }
  }

  cacheEvents(events: Event[]): void {
    this.set('public_events', events, 15);
  }

  getCachedEvents(): Event[] | null {
    return this.get<Event[]>('public_events');
  }

  clearEventsCache(): void {
    this.clear('public_events');
  }

  getEventPage(
    page: number,
    limit: number = 30
  ): { events: Event[]; pagination: any } | null {
    const allEvents = this.getCachedEvents();

    if (!allEvents) {
      return null;
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedEvents = allEvents.slice(start, end);

    const total = allEvents.length;
    const totalPages = Math.ceil(total / limit);

    return {
      events: paginatedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
