import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { AuthService, UserPreference } from '../../core/auth/auth.service';
import { EventCategory, EVENT_CATEGORIES, getCategoriesBySegment } from '../../shared/constants/event-categories.constants';

// Alias pour compatibilité avec le code existant
export interface PreferenceCategory extends EventCategory {}

export interface PreferencesResponse {
  success: boolean;
  message: string;
  preferences?: UserPreference[];
}

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    // console.log(
    //   'PreferencesService initialized with',
    //   EVENT_CATEGORIES.length,
    //   'categories'
    // );
  }

  getCategoriesBySegment(
    segment: 'sports' | 'music' | 'arts'
  ): PreferenceCategory[] {
    const filtered = getCategoriesBySegment(segment);
    // console.log(`Getting categories for segment ${segment}:`, filtered.length);
    return filtered;
  }

  getUserPreferences(): Observable<UserPreference[]> {
    return this.http.get<UserPreference[]>(
      this.configService.getApiEndpoint('/users/preferences'),
      { headers: this.authService.getAuthHeaders() }
    );
  }

  createPreferences(
    classificationNames: string[]
  ): Observable<PreferencesResponse> {
    return this.http
      .post<PreferencesResponse>(
        this.configService.getApiEndpoint('/users/preferences'),
        { classificationNames },
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(
        tap((response) => {
          if (response.success && response.preferences) {
            this.authService.updateUserPreferences(response.preferences);
          }
        })
      );
  }

  deletePreference(preferenceId: number): Observable<void> {
    return this.http
      .delete<void>(
        this.configService.getApiEndpoint(`/users/preferences/${preferenceId}`),
        { headers: this.authService.getAuthHeaders() }
      )
      .pipe(
        tap(() => {
          const currentPrefs = this.authService.getUserPreferences();
          const updatedPrefs = currentPrefs.filter(
            (p) => p.id !== preferenceId
          );
          this.authService.updateUserPreferences(updatedPrefs);
        })
      );
  }
}
