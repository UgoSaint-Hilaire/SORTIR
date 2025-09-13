import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ConfigService, CacheService } from '../../core/services';

@Injectable({
  providedIn: 'root',
})
export class ExplorerFeedService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private cacheService: CacheService
  ) {}

  getAllEventsFeed(page: number = 1, limit: number = 30, segment?: string | null, genre?: string | null): Observable<any> {
    // Vérifier le cache avant l'appel API
    const cachedPage = this.getCachedPage(page, limit, segment, genre);
    if (cachedPage) {
      return of({
        success: true,
        data: cachedPage,
      });
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (segment) {
      params = params.set('segment', segment);
    }

    if (genre) {
      params = params.set('genre', genre);
    }

    return this.http.get<any>(
      this.configService.getApiEndpoint('/feed/all'),
      { params }
    ).pipe(
      tap((response) => {
        // Mettre en cache les résultats
        if (response.success && response.data && response.data.events) {
          this.cacheResults(response.data, segment, genre);
        }
      })
    );
  }

  private getCacheKey(segment?: string | null, genre?: string | null): string {
    const segmentKey = segment || 'all';
    const genreKey = genre || '';
    return `explorer_events_${segmentKey}_${genreKey}`;
  }

  private cacheResults(data: any, segment?: string | null, genre?: string | null): void {
    const cacheKey = this.getCacheKey(segment, genre);
    // Stocker les données complètes (events + pagination) pendant 10 minutes
    this.cacheService.set(cacheKey, data, 10);
  }

  private getCachedPage(page: number, limit: number, segment?: string | null, genre?: string | null): any | null {
    const cacheKey = this.getCacheKey(segment, genre);
    const cachedData = this.cacheService.get<any>(cacheKey);

    if (!cachedData || !cachedData.events) {
      return null;
    }

    // Pour page 1, on retourne directement le cache si disponible
    if (page === 1 && cachedData.pagination) {
      return cachedData;
    }

    return null;
  }

  clearCache(segment?: string | null, genre?: string | null): void {
    const cacheKey = this.getCacheKey(segment, genre);
    this.cacheService.clear(cacheKey);
  }

  clearAllCache(): void {
    // Nettoyer tous les caches d'explorer
    ['all', 'Musique', 'Sports', 'Arts et théâtre'].forEach(seg => {
      const cacheKey = this.getCacheKey(seg === 'all' ? null : seg);
      this.cacheService.clear(cacheKey);
    });
  }
}