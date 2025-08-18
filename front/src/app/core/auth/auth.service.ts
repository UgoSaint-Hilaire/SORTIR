import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ConfigService } from '../services/config.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreference {
  id: number;
  classificationId: string;
  classificationName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  code: number;
  message: string;
  user?: User;
  access_token?: string;
  preferences?: UserPreference[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userPreferencesSubject = new BehaviorSubject<UserPreference[]>([]);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public userPreferences$ = this.userPreferencesSubject.asObservable();

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    const preferences = this.getStoredPreferences();

    if (token && user) {
      if (this.isTokenValid(token)) {
        console.log('Token valid, user authenticated');
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.userPreferencesSubject.next(preferences || []);
      } else {
        console.log('Token expired, clearing auth data');
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        this.configService.getApiEndpoint('/auth/login'),
        credentials
      )
      .pipe(
        tap((response) => {
          console.log('Login response:', response);
          if (response.success && response.access_token && response.user) {
            console.log('Setting auth with user:', response.user);
            this.setAuth(response.user, response.access_token, response.preferences || []);
          } else {
            console.log('Login response missing required fields:', {
              success: response.success,
              hasToken: !!response.access_token,
              hasUser: !!response.user,
            });
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        this.configService.getApiEndpoint('/auth/register'),
        userData
      )
      .pipe(
        tap((response) => {
          if (response.success && response.access_token && response.user) {
            this.setAuth(response.user, response.access_token, response.preferences || []);
          }
        })
      );
  }

  logout(): Observable<AuthResponse> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );

    return this.http
      .post<AuthResponse>(
        this.configService.getApiEndpoint('/auth/logout'),
        {},
        { headers }
      )
      .pipe(
        tap(() => {
          this.clearAuth();
        })
      );
  }

  private setAuth(user: User, token: string, preferences: UserPreference[] = []): void {
    console.log('setAuth called with:', {
      user,
      token: token ? 'present' : 'missing',
      preferencesCount: preferences.length
    });
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.userPreferencesSubject.next(preferences);
    console.log(
      'Auth state updated. isAuthenticated:',
      this.isAuthenticatedSubject.value
    );
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_preferences');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.userPreferencesSubject.next([]);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      console.log('Token expiry check:', {
        expiry,
        now,
        isValid: now < expiry,
      });
      return now < expiry;
    } catch (error) {
      console.log('Token validation error:', error);
      return false;
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private getStoredPreferences(): UserPreference[] {
    const preferencesStr = localStorage.getItem('user_preferences');
    return preferencesStr ? JSON.parse(preferencesStr) : [];
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserPreferences(): UserPreference[] {
    return this.userPreferencesSubject.value;
  }

  updateUserPreferences(preferences: UserPreference[]): void {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    this.userPreferencesSubject.next(preferences);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token && !this.isTokenValid(token)) {
      console.log('Token expired during check, clearing auth');
      this.clearAuth();
      return false;
    }
    return this.isAuthenticatedSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    } else {
      if (token) {
        console.log('Token expired in getAuthHeaders, clearing auth');
        this.clearAuth();
      }
      return new HttpHeaders();
    }
  }
}
