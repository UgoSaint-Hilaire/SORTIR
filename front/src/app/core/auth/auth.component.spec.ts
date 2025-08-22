import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AuthComponent } from './auth.component';
import { AuthService } from './auth.service';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

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
      ['login', 'register'],
      {
        currentUser$: of(null),
        isAuthenticated$: of(false),
      }
    );
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AuthComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FormBuilder,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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

    it('should initialize reactive forms', () => {
      expect(component.loginFormGroup).toBeDefined();
      expect(component.registerFormGroup).toBeDefined();
      
      // Check initial form values
      expect(component.loginFormGroup.get('email')?.value).toBe('');
      expect(component.loginFormGroup.get('password')?.value).toBe('');
      expect(component.registerFormGroup.get('username')?.value).toBe('');
      expect(component.registerFormGroup.get('email')?.value).toBe('');
      expect(component.registerFormGroup.get('password')?.value).toBe('');
    });

    it('should have proper form validation setup', () => {
      const loginEmail = component.loginFormGroup.get('email');
      const loginPassword = component.loginFormGroup.get('password');
      const registerUsername = component.registerFormGroup.get('username');
      const registerEmail = component.registerFormGroup.get('email');
      const registerPassword = component.registerFormGroup.get('password');

      expect(loginEmail?.hasError('required')).toBe(true);
      expect(loginPassword?.hasError('required')).toBe(true);
      expect(registerUsername?.hasError('required')).toBe(true);
      expect(registerEmail?.hasError('required')).toBe(true);
      expect(registerPassword?.hasError('required')).toBe(true);
    });
  });

  describe('form getters', () => {
    it('should return correct form controls', () => {
      expect(component.loginEmail).toBe(component.loginFormGroup.get('email'));
      expect(component.loginPassword).toBe(component.loginFormGroup.get('password'));
      expect(component.registerUsername).toBe(component.registerFormGroup.get('username'));
      expect(component.registerEmail).toBe(component.registerFormGroup.get('email'));
      expect(component.registerPassword).toBe(component.registerFormGroup.get('password'));
    });
  });

  describe('validation methods', () => {
    it('should correctly identify invalid fields', () => {
      const emailControl = component.loginFormGroup.get('email');
      emailControl?.markAsTouched();
      emailControl?.setErrors({ required: true });

      expect(component.isFieldInvalid(emailControl)).toBe(true);

      emailControl?.setErrors(null);
      expect(component.isFieldInvalid(emailControl)).toBe(false);
    });

    it('should return correct error messages', () => {
      const emailControl = component.loginFormGroup.get('email');
      emailControl?.setErrors({ required: true });

      const errorMessage = component.getErrorMessage('email', emailControl);
      expect(errorMessage).toBe("L'email est requis");

      emailControl?.setErrors({ email: true });
      const emailErrorMessage = component.getErrorMessage('email', emailControl);
      expect(emailErrorMessage).toBe("Format d'email invalide");
    });
  });

  describe('password strength validators', () => {
    it('should validate uppercase letters', () => {
      expect(component.hasUpperCase('Password')).toBe(true);
      expect(component.hasUpperCase('password')).toBe(false);
    });

    it('should validate lowercase letters', () => {
      expect(component.hasLowerCase('Password')).toBe(true);
      expect(component.hasLowerCase('PASSWORD')).toBe(false);
    });

    it('should validate numbers', () => {
      expect(component.hasNumber('Pass123')).toBe(true);
      expect(component.hasNumber('Password')).toBe(false);
    });

    it('should validate special characters', () => {
      expect(component.hasSpecialChar('Pass@123')).toBe(true);
      expect(component.hasSpecialChar('Pass123')).toBe(false);
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

  });

  describe('modal functionality', () => {
    it('should emit close event when closeModal is called', () => {
      spyOn(component.close, 'emit');

      component.closeModal();

      expect(component.close.emit).toHaveBeenCalled();
    });

  });

  describe('login functionality', () => {
    beforeEach(() => {
      component.isLoginMode = true;
      component.loginFormGroup.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should not submit invalid login form', () => {
      component.loginFormGroup.get('email')?.setValue('');
      component.loginFormGroup.get('password')?.setValue('');

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
      expect(component.loginFormGroup.get('email')?.touched).toBe(true);
      expect(component.loginFormGroup.get('password')?.touched).toBe(true);
    });

    it('should login successfully with valid form', fakeAsync(() => {
      authService.login.and.returnValue(of(mockAuthResponse));
      spyOn(component, 'closeModal');

      component.onSubmit();
      tick();

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
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
  });

  describe('registration functionality', () => {
    beforeEach(() => {
      component.isLoginMode = false;
      component.registerFormGroup.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    it('should not submit invalid registration form', () => {
      component.registerFormGroup.get('username')?.setValue('ab'); // Too short

      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
      expect(component.registerFormGroup.get('username')?.touched).toBe(true);
    });

    it('should register successfully with valid form', fakeAsync(() => {
      authService.register.and.returnValue(of(mockAuthResponse));
      spyOn(component, 'closeModal');

      component.onSubmit();
      tick();

      expect(authService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(component.isLoading).toBe(false);
      expect(component.successMessage).toBe('Inscription réussie ! Redirection vers vos préférences...');

      tick(1000);
      expect(component.closeModal).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    }));

    it('should handle registration error', () => {
      const errorResponse = {
        success: false,
        code: 409,
        message: 'Email already exists',
      };
      authService.register.and.returnValue(of(errorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Email already exists');
    });

    it('should handle HTTP error during registration', () => {
      const httpError = { error: { message: 'Validation error' } };
      authService.register.and.returnValue(throwError(() => httpError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Validation error');
    });
  });

  describe('form validation edge cases', () => {
    it('should validate username pattern', () => {
      const usernameControl = component.registerFormGroup.get('username');
      usernameControl?.setValue('user@name'); // Invalid characters

      expect(usernameControl?.hasError('pattern')).toBe(true);

      usernameControl?.setValue('username123'); // Valid
      expect(usernameControl?.hasError('pattern')).toBe(false);
    });

    it('should validate email format', () => {
      const emailControl = component.registerFormGroup.get('email');
      emailControl?.setValue('invalid-email');

      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should validate password complexity', () => {
      const passwordControl = component.registerFormGroup.get('password');
      
      // Too short
      passwordControl?.setValue('Pass1!');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      // Missing uppercase
      passwordControl?.setValue('password1!');
      expect(passwordControl?.hasError('pattern')).toBe(true);

      // Missing lowercase
      passwordControl?.setValue('PASSWORD1!');
      expect(passwordControl?.hasError('pattern')).toBe(true);

      // Missing number
      passwordControl?.setValue('Password!');
      expect(passwordControl?.hasError('pattern')).toBe(true);

      // Missing special character
      passwordControl?.setValue('Password123');
      expect(passwordControl?.hasError('pattern')).toBe(true);

      // Valid password
      passwordControl?.setValue('Password123!');
      expect(passwordControl?.valid).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should clear messages', () => {
      component.errorMessage = 'Error';
      component.successMessage = 'Success';

      component.clearMessages();

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

  });
});
