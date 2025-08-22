import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from './auth.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  loginFormGroup: FormGroup;
  registerFormGroup: FormGroup;

  validationMessages = {
    username: {
      required: "Le nom d'utilisateur est requis",
      minlength: "Le nom d'utilisateur doit contenir au moins 3 caractères",
      maxlength: "Le nom d'utilisateur ne doit pas dépasser 20 caractères",
      pattern:
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores",
    },
    email: {
      required: "L'email est requis",
      email: "Format d'email invalide",
    },
    password: {
      required: 'Le mot de passe est requis',
      minlength: 'Le mot de passe doit contenir au moins 8 caractères',
      maxlength: 'Le mot de passe est trop long',
      pattern:
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginFormGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.registerFormGroup = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9_-]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
          ),
        ],
      ],
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.resetForms();
  }

  get loginEmail() {
    return this.loginFormGroup.get('email');
  }
  get loginPassword() {
    return this.loginFormGroup.get('password');
  }
  get registerUsername() {
    return this.registerFormGroup.get('username');
  }
  get registerEmail() {
    return this.registerFormGroup.get('email');
  }
  get registerPassword() {
    return this.registerFormGroup.get('password');
  }

  isFieldInvalid(field: AbstractControl | null): boolean {
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string, field: AbstractControl | null): string {
    if (!field || !field.errors) return '';

    const errors = field.errors;
    const messages =
      this.validationMessages[
        fieldName as keyof typeof this.validationMessages
      ];

    if (errors['required']) return messages.required;
    if (errors['email'] && 'email' in messages) return (messages as any).email;
    if (errors['minlength'] && 'minlength' in messages)
      return (messages as any).minlength;
    if (errors['maxlength'] && 'maxlength' in messages)
      return (messages as any).maxlength;
    if (errors['pattern'] && 'pattern' in messages)
      return (messages as any).pattern;

    return '';
  }

  hasUpperCase(value: string): boolean {
    return /[A-Z]/.test(value);
  }

  hasLowerCase(value: string): boolean {
    return /[a-z]/.test(value);
  }

  hasNumber(value: string): boolean {
    return /\d/.test(value);
  }

  hasSpecialChar(value: string): boolean {
    return /[@$!%*?&]/.test(value);
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  private login(): void {
    if (this.loginFormGroup.invalid) {
      this.loginFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const loginData: LoginRequest = this.loginFormGroup.value;
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Connexion réussie !';
          setTimeout(() => {
            this.closeModal();
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de la connexion';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Erreur lors de la connexion';
      },
    });
  }

  private register(): void {
    if (this.registerFormGroup.invalid) {
      this.registerFormGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const registerData: RegisterRequest = this.registerFormGroup.value;
    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage =
            'Inscription réussie ! Redirection vers vos préférences...';
          setTimeout(() => {
            this.closeModal();
            this.router.navigate(['/profile']);
          }, 1000);
        } else {
          this.errorMessage =
            response.message || "Erreur lors de l'inscription";
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || "Erreur lors de l'inscription";
      },
    });
  }

  closeModal(): void {
    this.close.emit();
    this.resetForms();
    this.clearMessages();
  }

  resetForms(): void {
    this.loginFormGroup.reset();
    this.registerFormGroup.reset();
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
