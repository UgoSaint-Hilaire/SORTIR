import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../core/auth/auth.service';
import { PreferencesService } from './preferences-selector/preferences.service';
import { PreferencesSelectorComponent } from './preferences-selector/preferences-selector.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, DatePipe, PreferencesSelectorComponent],
  templateUrl: './profil.component.html',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  showPreferences = false;
  preferenceCount = 0;
  activeTab: 'profil' | 'historique' = 'profil';
  avatarUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private preferencesService: PreferencesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.avatarUrl = this.authService.getCurrentUserAvatar({ size: 200, mood: 'happy' });
    this.preferenceCount = this.authService.getUserPreferences().length;

    if (this.preferenceCount === 0) {
      this.showPreferences = true;
    }
  }

  togglePreferences(): void {
    this.showPreferences = !this.showPreferences;
  }

  setActiveTab(tab: 'profil' | 'historique'): void {
    this.activeTab = tab;
  }
}
