import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService, CacheService } from '../../core/services';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CustomFeedService {
  private readonly CUSTOM_EVENTS_KEY = 'custom_events';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private cacheService: CacheService,
    private authService: AuthService
  ) {}

  getCustomFeed(page: number = 1, limit: number = 30): Observable<any> {
    const cachedPage = this.getCustomEventPage(page, limit);

    if (cachedPage) {
      // console.log('Cache hit custom feed ! page actuelle :', page);

      return of({
        success: true,
        data: cachedPage,
      });
    }

    // console.log(
    //   'Cache miss custom feed :( Récupération de tous les événements depuis le back'
    // );

    const headers = this.authService.getAuthHeaders();

    return this.http
      .get<any>(this.configService.getApiEndpoint('/feed'), { headers })
      .pipe(
        tap((response) => {
          if (response.success && response.data && response.data.events) {
            // Ne pas mettre en cache si l'utilisateur n'a pas de préférences
            if (response.data.noResultsReason !== 'no_preferences') {
              this.cacheCustomEvents(response.data.events);
              // console.log(
              //   `Mis en cache ${response.data.events.length} événements custom`
              // );
            }
          }
        }),
        map((response) => {
          if (
            response.success &&
            response.data.noResultsReason === 'no_preferences'
          ) {
            return response;
          }

          if (response.success) {
            const cachedPage = this.getCustomEventPage(page, limit);

            if (cachedPage) {
              return {
                success: true,
                data: {
                  ...cachedPage,
                  noResultsReason: response.data.noResultsReason,
                },
              };
            }
          }

          return response;
        })
      );
  }

  private cacheCustomEvents(events: any[]): void {
    this.cacheService.set(this.CUSTOM_EVENTS_KEY, events, 15);
  }

  private getCustomEventPage(page: number, limit: number): any | null {
    const allEvents = this.cacheService.get<any[]>(this.CUSTOM_EVENTS_KEY);

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

  getCustomCachedEvents(): any[] | null {
    return this.cacheService.get<any[]>(this.CUSTOM_EVENTS_KEY);
  }

  clearCustomEventsCache(): void {
    this.cacheService.clear(this.CUSTOM_EVENTS_KEY);
  }
}
