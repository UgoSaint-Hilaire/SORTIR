import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigService, CacheService } from '../../core/services';

@Injectable({
  providedIn: 'root',
})
export class PublicFeedService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private cacheService: CacheService
  ) {}

  getPublicFeed(page: number = 1, limit: number = 30): Observable<any> {
    // Vérifie si on a déjà les événements en cache
    const cachedPage = this.cacheService.getEventPage(page, limit);

    if (cachedPage) {
      console.log('Cache hit ! page actuelle :', page);

      return of({
        success: true,
        data: cachedPage,
      });
    }

    console.log(
      'Cache miss :( Récupération de tous les événements depuis le back'
    );

    return this.http
      .get<any>(this.configService.getApiEndpoint('/feed/public'))
      .pipe(
        tap((response) => {
          if (response.success && response.data && response.data.events) {
            this.cacheService.cacheEvents(response.data.events);
            console.log(
              `Mis en cache ${response.data.events.length} événements`
            );
          }
        }),
        map((response) => {
          if (response.success) {
            const cachedPage = this.cacheService.getEventPage(page, limit);

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
}
