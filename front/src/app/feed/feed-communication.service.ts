import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeedCommunicationService {
  // État simple pour l'onglet actif et les données de filtres
  activeTab = signal<'personal' | 'public'>('public');
  selectedSegment = signal<string | null>(null);
  totalCount = signal<number>(0);
  loading = signal<boolean>(false);

  setActiveTab(tab: 'personal' | 'public') {
    this.activeTab.set(tab);
  }

  setSelectedSegment(segment: string | null) {
    this.selectedSegment.set(segment);
  }

  updateFeedData(data: { totalCount: number, loading: boolean, selectedSegment: string | null }) {
    this.totalCount.set(data.totalCount);
    this.loading.set(data.loading);
    this.selectedSegment.set(data.selectedSegment);
  }
}