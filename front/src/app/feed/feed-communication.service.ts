import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeedCommunicationService {
  // État simple pour l'onglet actif et les données de filtres
  activeTab = signal<'personal' | 'public' | 'explorer'>('public');
  selectedSegments = signal<string[]>([]);
  selectedGenres = signal<string[]>([]);
  totalCount = signal<number>(0);
  loading = signal<boolean>(false);

  setActiveTab(tab: 'personal' | 'public' | 'explorer') {
    this.activeTab.set(tab);
  }

  setSelectedSegments(segments: string[]) {
    this.selectedSegments.set(segments);
  }

  setSelectedGenres(genres: string[]) {
    this.selectedGenres.set(genres);
  }

  updateFeedData(data: { 
    totalCount: number, 
    loading: boolean, 
    selectedSegments?: string[],
    selectedGenres?: string[]
  }) {
    this.totalCount.set(data.totalCount);
    this.loading.set(data.loading);
    if (data.selectedSegments !== undefined) {
      this.selectedSegments.set(data.selectedSegments);
    }
    if (data.selectedGenres !== undefined) {
      this.selectedGenres.set(data.selectedGenres);
    }
  }
}