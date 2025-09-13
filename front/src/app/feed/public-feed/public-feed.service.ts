import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService, CacheService } from '../../core/services';

export interface EventSegment {
  id: string;
  name: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class PublicFeedService {
  public readonly SEGMENTS: EventSegment[] = [
    { id: 'Musique', name: 'Musique', label: 'Musique' },
    { id: 'Sports', name: 'Sports', label: 'Sports' },
    { id: 'Arts et théâtre', name: 'Arts et théâtre', label: 'Arts & Théâtre' },
  ];

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private cacheService: CacheService
  ) {}

  private readonly PUBLIC_EVENTS_KEY = 'public_events';

  getPublicFeed(page: number = 1, limit: number = 30, segment?: string | null): Observable<any> {
    // Si un segment est spécifié, on utilise le même endpoint avec les paramètres de filtre
    if (segment) {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString())
        .set('segment', segment);

      return this.http.get<any>(
        this.configService.getApiEndpoint('/feed/public'),
        { params }
      );
    }

    // Pour le feed sans filtre, on continue avec la logique de cache existante
    const cachedPage = this.getPublicEventPage(page, limit);

    if (cachedPage) {
      // console.log('Cache hit ! page actuelle :', page);

      return of({
        success: true,
        data: cachedPage,
      });
    }

    // console.log(
    //   'Cache miss :( Récupération de tous les événements depuis le back'
    // );

    return this.http
      .get<any>(this.configService.getApiEndpoint('/feed/public'))
      .pipe(
        tap((response) => {
          if (response.success && response.data && response.data.events) {
            this.cachePublicEvents(response.data.events);
            // console.log(
            //   `Mis en cache ${response.data.events.length} événements`
            // );
          }
        }),
        map((response) => {
          if (response.success) {
            const cachedPage = this.getPublicEventPage(page, limit);

            if (cachedPage) {
              return {
                success: true,
                data: cachedPage,
              };
            }
          }

          return response;
        })
      );
  }

  private cachePublicEvents(events: any[]): void {
    this.cacheService.set(this.PUBLIC_EVENTS_KEY, events, 15);
  }

  private getPublicEventPage(page: number, limit: number): any | null {
    const allEvents = this.cacheService.get<any[]>(this.PUBLIC_EVENTS_KEY);

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

  getPublicCachedEvents(): any[] | null {
    return this.cacheService.get<any[]>(this.PUBLIC_EVENTS_KEY);
  }

  clearPublicEventsCache(): void {
    this.cacheService.clear(this.PUBLIC_EVENTS_KEY);
  }

  getSegments(): EventSegment[] {
    return this.SEGMENTS;
  }
}
