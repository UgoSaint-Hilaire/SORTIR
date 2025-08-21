import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PreferencesService, PreferenceCategory } from './preferences.service';
import { AuthService } from '../../core/auth/auth.service';

interface CategoryGroup {
  segment: 'sports' | 'music' | 'arts';
  title: string;
  categories: PreferenceCategory[];
}

@Component({
  selector: 'app-preferences-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './preferences-selector.component.html',
})
export class PreferencesSelectorComponent implements OnInit {
  categoryGroups: CategoryGroup[] = [];
  selectedPreferences: Set<string> = new Set();
  activeTab: 'music' | 'sports' | 'arts' = 'music';
  loading = false;
  error = '';
  success = '';

  constructor(
    private preferencesService: PreferencesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategoriesByGroup();
    this.loadExistingPreferences();
  }

  loadCategoriesByGroup(): void {
    const sportCategories =
      this.preferencesService.getCategoriesBySegment('sports');
    const musicCategories =
      this.preferencesService.getCategoriesBySegment('music');
    const artsCategories =
      this.preferencesService.getCategoriesBySegment('arts');

    this.categoryGroups = [
      {
        segment: 'music',
        title: 'Musique',
        categories: musicCategories,
      },
      {
        segment: 'sports',
        title: 'Sports',
        categories: sportCategories,
      },
      {
        segment: 'arts',
        title: 'Arts & Théâtre',
        categories: artsCategories,
      },
    ];

    console.log('Category groups loaded:', this.categoryGroups);
  }

  loadExistingPreferences(): void {
    const userPreferences = this.authService.getUserPreferences();
    userPreferences.forEach((pref) => {
      this.selectedPreferences.add(pref.classificationName);
    });
  }

  isSelected(categoryName: string): boolean {
    return this.selectedPreferences.has(categoryName);
  }

  togglePreference(categoryName: string): void {
    if (this.selectedPreferences.has(categoryName)) {
      this.selectedPreferences.delete(categoryName);
    } else {
      this.selectedPreferences.add(categoryName);
    }
  }

  savePreferences(): void {
    if (this.selectedPreferences.size === 0) {
      this.error = 'Veuillez sélectionner au moins une préférence';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const newPreferences = Array.from(this.selectedPreferences);

    this.preferencesService.createPreferences(newPreferences).subscribe({
      next: (response) => {
        this.success =
          response.message || 'Préférences mises à jour avec succès';
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 1500);
      },
      error: (error) => {
        this.error =
          error.error?.message ||
          'Erreur lors de la sauvegarde des préférences';
        this.loading = false;
      },
    });
  }

  clearSelection(): void {
    this.selectedPreferences.clear();
  }

  get selectedCount(): number {
    return this.selectedPreferences.size;
  }

  setActiveTab(tab: 'music' | 'sports' | 'arts'): void {
    this.activeTab = tab;
  }

  getActiveGroup(): CategoryGroup | undefined {
    return this.categoryGroups.find(
      (group) => group.segment === this.activeTab
    );
  }
}
