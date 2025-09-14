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

  getAllEventsFeed(page: number = 1, limit: number = 30, segments?: string[], genres?: string[], genre?: string | null): Observable<any> {
    // Vérifier le cache avant l'appel API
    const cachedPage = this.getCachedPage(page, limit, segments, genres, genre);
    if (cachedPage) {
      return of({
        success: true,
        data: cachedPage,
      });
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (segments && segments.length > 0) {
      params = params.set('segments', segments.join(','));
    }

    if (genres && genres.length > 0) {
      params = params.set('genres', genres.join(','));
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
          this.cacheResults(response.data, segments, genres, genre);
        }
      })
    );
  }

  private getCacheKey(segments?: string[], genres?: string[], genre?: string | null): string {
    const segmentKey = segments && segments.length > 0 ? segments.sort().join('_') : 'all';
    const genresKey = genres && genres.length > 0 ? genres.sort().join('_') : 'all';
    const genreKey = genre || '';
    return `explorer_events_${segmentKey}_${genresKey}_${genreKey}`;
  }

  private cacheResults(data: any, segments?: string[], genres?: string[], genre?: string | null): void {
    const cacheKey = this.getCacheKey(segments, genres, genre);
    // Stocker les données complètes (events + pagination) pendant 10 minutes
    this.cacheService.set(cacheKey, data, 10);
  }

  private getCachedPage(page: number, limit: number, segments?: string[], genres?: string[], genre?: string | null): any | null {
    const cacheKey = this.getCacheKey(segments, genres, genre);
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

  clearCache(segments?: string[], genres?: string[], genre?: string | null): void {
    const cacheKey = this.getCacheKey(segments, genres, genre);
    this.cacheService.clear(cacheKey);
  }

  clearAllCache(): void {
    // Nettoyer tous les caches d'explorer
    const allCombinations = [
      [], // tous
      ['Musique'],
      ['Sports'], 
      ['Arts et théâtre'],
      ['Musique', 'Sports'],
      ['Musique', 'Arts et théâtre'],
      ['Sports', 'Arts et théâtre'],
      ['Musique', 'Sports', 'Arts et théâtre']
    ];
    
    allCombinations.forEach(segments => {
      const cacheKey = this.getCacheKey(segments.length > 0 ? segments : undefined);
      this.cacheService.clear(cacheKey);
    });
  }
}