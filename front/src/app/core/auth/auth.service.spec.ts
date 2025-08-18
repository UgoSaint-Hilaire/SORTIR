import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import {
  AuthService,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from './auth.service';
import { ConfigService } from '../services/config.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  // Create a valid JWT token that won't expire during tests
  const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const payload = { exp: futureTimestamp, userId: 1 };
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockValidToken = `header.${encodedPayload}.signature`;
  
  const mockAuthResponse: AuthResponse = {
    success: true,
    code: 200,
    message: 'Success',
    user: mockUser,
    access_token: mockValidToken,
    preferences: [],
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ConfigService', ['getApiEndpoint']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: spy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(
      ConfigService
    ) as jasmine.SpyObj<ConfigService>;

    // Mock the actual endpoint concatenation behavior
    configService.getApiEndpoint.and.callFake(
      (endpoint: string) => `http://localhost:3000${endpoint}`
    );

    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset the service state to ensure clean tests
    service['currentUserSubject'].next(null);
    service['isAuthenticatedSubject'].next(false);
    service['userPreferencesSubject'].next([]);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and set auth state', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe((response) => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockAuthResponse);

      // Check auth state after the response is processed
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe(mockValidToken);
      expect(localStorage.getItem('current_user')).toBe(
        JSON.stringify(mockUser)
      );
    });

    it('should handle login failure', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const errorResponse: AuthResponse = {
        success: false,
        code: 401,
        message: 'Invalid credentials',
      };

      service.login(loginRequest).subscribe((response) => {
        expect(response).toEqual(errorResponse);
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush(errorResponse);
    });
  });

  describe('register', () => {
    it('should register successfully and set auth state', () => {
      const registerRequest: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      service.register(registerRequest).subscribe((response) => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockAuthResponse);

      // Check auth state after the response is processed
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle registration failure', () => {
      const registerRequest: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const errorResponse: AuthResponse = {
        success: false,
        code: 400,
        message: 'Email already exists',
      };

      service.register(registerRequest).subscribe((response) => {
        expect(response).toEqual(errorResponse);
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      req.flush(errorResponse);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
    });

    it('should logout successfully and clear auth state', () => {
      const logoutResponse: AuthResponse = {
        success: true,
        code: 200,
        message: 'Logged out successfully',
      };

      service.logout().subscribe((response) => {
        expect(response).toEqual(logoutResponse);
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('current_user')).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-jwt-token'
      );
      req.flush(logoutResponse);
    });
  });

  describe('token validation', () => {
    it('should validate a valid JWT token', () => {
      // Create a valid JWT token (expires in the future)
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTimestamp, userId: 1 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      // Set auth state manually since constructor already ran
      service['setAuth'](mockUser, mockToken, []);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should invalidate an expired JWT token', () => {
      // Create an expired JWT token
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTimestamp, userId: 1 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      // Call isAuthenticated which should clear expired token
      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });

    it('should handle invalid JWT token format', () => {
      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      // Call isAuthenticated which should clear invalid token
      const isAuth = service.isAuthenticated();

      expect(isAuth).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers with valid token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTimestamp, userId: 1 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      // Set auth state manually
      service['setAuth'](mockUser, mockToken, []);

      const headers = service.getAuthHeaders();
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });

    it('should return empty headers with expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: pastTimestamp, userId: 1 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      localStorage.setItem('auth_token', mockToken);

      const headers = service.getAuthHeaders();
      expect(headers.get('Authorization')).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull(); // Should be cleared
    });
  });
});
