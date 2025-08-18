import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AuthComponent } from './auth.component';
import { AuthService } from './auth.service';
import { ConfigService } from '../services/config.service';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let configService: jasmine.SpyObj<ConfigService>;

  const mockAuthResponse = {
    success: true,
    code: 200,
    message: 'Success',
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    access_token: 'mock-token',
  };

  const mockErrorResponse = {
    success: false,
    code: 400,
    message: 'Invalid credentials',
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj(
      'AuthService',
      [
        'login',
        'register',
        'logout',
        'getCurrentUser',
        'isAuthenticated',
        'getToken',
        'clearAuth',
      ],
      {
        currentUser$: of(null),
        isAuthenticated$: of(false),
      }
    );
    const configSpy = jasmine.createSpyObj('ConfigService', ['getApiEndpoint']);

    await TestBed.configureTestingModule({
      imports: [AuthComponent, FormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: ConfigService, useValue: configSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    configService = TestBed.inject(
      ConfigService
    ) as jasmine.SpyObj<ConfigService>;

    // Mock the actual endpoint concatenation behavior
    configService.getApiEndpoint.and.callFake(
      (endpoint: string) => `http://localhost:3000${endpoint}`
    );

    // Setup default returns for AuthService methods
    authService.getCurrentUser.and.returnValue(null);
    authService.isAuthenticated.and.returnValue(false);
    authService.getToken.and.returnValue(null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component initialization', () => {
    it('should initialize with default values', () => {
      expect(component.isLoginMode).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
      expect(component.isOpen).toBe(false);
    });

    it('should initialize forms with empty values', () => {
      expect(component.loginForm).toEqual({ email: '', password: '' });
      expect(component.registerForm).toEqual({
        username: '',
        email: '',
        password: '',
      });
    });
  });

  describe('mode switching', () => {
    it('should switch to registration mode', () => {
      component.isLoginMode = true;
      component.toggleMode();

      expect(component.isLoginMode).toBe(false);
    });

    it('should switch to login mode', () => {
      component.isLoginMode = false;
      component.toggleMode();

      expect(component.isLoginMode).toBe(true);
    });

    it('should clear messages and reset forms when switching modes', () => {
      component.errorMessage = 'Test error';
      component.successMessage = 'Test success';
      component.loginForm.email = 'test@email.com';

      component.toggleMode();

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
      expect(component.loginForm.email).toBe('');
    });
  });

  describe('modal functionality', () => {
    it('should emit close event when closeModal is called', () => {
      spyOn(component.close, 'emit');

      component.closeModal();

      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should reset forms and clear messages when closing modal', () => {
      component.errorMessage = 'Test error';
      component.loginForm.email = 'test@email.com';

      component.closeModal();

      expect(component.errorMessage).toBe('');
      expect(component.loginForm.email).toBe('');
    });
  });

  describe('form validation', () => {
    it('should show error for empty login form', () => {
      component.isLoginMode = true;
      component.loginForm = { email: '', password: '' };

      component.onSubmit();

      expect(component.errorMessage).toBe('Veuillez remplir tous les champs');
    });

    it('should show error for incomplete login form', () => {
      component.isLoginMode = true;
      component.loginForm = { email: 'test@email.com', password: '' };

      component.onSubmit();

      expect(component.errorMessage).toBe('Veuillez remplir tous les champs');
    });

    it('should show error for empty registration form', () => {
      component.isLoginMode = false;
      component.registerForm = { username: '', email: '', password: '' };

      component.onSubmit();

      expect(component.errorMessage).toBe('Veuillez remplir tous les champs');
    });

    it('should show error for short username', () => {
      component.isLoginMode = false;
      component.registerForm = {
        username: 'ab',
        email: 'test@email.com',
        password: 'password123',
      };

      component.onSubmit();

      expect(component.errorMessage).toBe(
        "Le nom d'utilisateur doit contenir au moins 3 caractères"
      );
    });

    it('should show error for short password', () => {
      component.isLoginMode = false;
      component.registerForm = {
        username: 'testuser',
        email: 'test@email.com',
        password: '12345',
      };

      component.onSubmit();

      expect(component.errorMessage).toBe(
        'Le mot de passe doit contenir au moins 6 caractères'
      );
    });
  });

  describe('login functionality', () => {
    beforeEach(() => {
      component.isLoginMode = true;
      component.loginForm = {
        email: 'test@example.com',
        password: 'password123',
      };
    });

    it('should login successfully', fakeAsync(() => {
      authService.login.and.returnValue(of(mockAuthResponse));
      spyOn(component, 'closeModal');

      component.onSubmit();
      tick();

      expect(authService.login).toHaveBeenCalledWith(component.loginForm);
      expect(component.isLoading).toBe(false);
      expect(component.successMessage).toBe('Connexion réussie !');

      tick(1000);
      expect(component.closeModal).toHaveBeenCalled();
    }));

    it('should handle login error', () => {
      authService.login.and.returnValue(of(mockErrorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('should handle HTTP error during login', () => {
      const httpError = { error: { message: 'Network error' } };
      authService.login.and.returnValue(throwError(() => httpError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Network error');
    });

    it('should set loading state during login', () => {
      authService.login.and.returnValue(of(mockAuthResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false); // After completion
      expect(authService.login).toHaveBeenCalled();
    });
  });
});
