import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from './auth.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  loginForm: LoginRequest = {
    email: '',
    password: ''
  };

  registerForm: RegisterRequest = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.resetForms();
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  private login(): void {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.login(this.loginForm).subscribe({
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
        this.errorMessage = error.error?.message || 'Erreur lors de la connexion';
      }
    });
  }

  private register(): void {
    if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.registerForm.username.length < 3) {
      this.errorMessage = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
      return;
    }

    if (this.registerForm.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.register(this.registerForm).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Inscription réussie ! Redirection vers vos préférences...';
          setTimeout(() => {
            this.closeModal();
            this.router.navigate(['/profile']);
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de l\'inscription';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }

  closeModal(): void {
    this.close.emit();
    this.resetForms();
    this.clearMessages();
  }

  resetForms(): void {
    this.loginForm = { email: '', password: '' };
    this.registerForm = { username: '', email: '', password: '' };
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
