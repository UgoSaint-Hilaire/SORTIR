import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../events/event-card/event-card.component';
import { PublicFeedService, EventSegment } from '../public-feed/public-feed.service';
import { ExplorerFeedService } from './explorer-feed.service';
import { Event } from '../../models/event.model';
import { ConfigService } from '../../core/services';
import { FeedCommunicationService } from '../feed-communication.service';

@Component({
  selector: 'app-explorer-feed',
  standalone: true,
  imports: [CommonModule, EventCardComponent],
  templateUrl: './explorer-feed.component.html',
})
export class ExplorerFeedComponent implements OnInit, OnDestroy {
  private publicFeedService = inject(PublicFeedService);
  private explorerFeedService = inject(ExplorerFeedService);
  public configService = inject(ConfigService);
  private feedCommService = inject(FeedCommunicationService);

  events = signal<Event[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  isLoadingMore = signal(false);
  
  segments = signal<EventSegment[]>([]);
  selectedSegment = signal<string | null>(null);

  constructor() {
    // Écouter les changements du service de communication
    effect(() => {
      const newSegment = this.feedCommService.selectedSegment();
      if (newSegment !== this.selectedSegment()) {
        this.onSegmentSelected(newSegment);
      }
    });
    
    // Synchroniser l'état local avec le service
    effect(() => {
      this.feedCommService.updateFeedData({
        selectedSegment: this.selectedSegment(),
        totalCount: this.totalCount(),
        loading: this.loading()
      });
    });
  }

  private scrollHandler?: () => void;

  ngOnInit() {
    this.segments.set(this.publicFeedService.getSegments());
    
    // Récupérer l'état du filtre persisté depuis le service
    const persistedSegment = this.feedCommService.selectedSegment();
    this.selectedSegment.set(persistedSegment);
    
    this.loadInitialEvents();
    this.initializeScrollListener();
  }

  ngOnDestroy() {
    this.removeScrollListener();
  }

  onSegmentSelected(segment: string | null) {
    this.selectedSegment.set(segment);
    this.currentPage.set(1);
    this.events.set([]);
    // Clear cache pour ce filtre spécifique quand on change
    this.explorerFeedService.clearCache(segment);
    this.loadInitialEvents();
  }

  getSelectedSegmentLabel(): string {
    const segment = this.segments().find(s => s.name === this.selectedSegment());
    return segment ? segment.label : '';
  }

  private initializeScrollListener() {
    this.scrollHandler = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      const scrollPercentage =
        ((scrollTop + clientHeight) / scrollHeight) * 100;

      if (
        scrollPercentage >= 95 &&
        !this.isLoadingMore() &&
        this.currentPage() < this.totalPages()
      ) {
        this.loadNextPage();
      }
    };

    window.addEventListener('scroll', this.scrollHandler);
  }

  private removeScrollListener() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  private loadInitialEvents() {
    this.loading.set(true);
    this.error.set(null);

    // Explorer utilise TOUJOURS getAllEventsFeed pour une navigation complète paginée
    this.explorerFeedService.getAllEventsFeed(1, 30, this.selectedSegment()).subscribe({
      next: (response: any) => {
        if (!response.success) {
          this.events.set([]);
          this.totalCount.set(0);
          this.error.set(
            response.message ||
              'Une erreur est survenue lors du chargement des événements.'
          );
          this.loading.set(false);
          return;
        }

        if (response.data && response.data.events) {
          const newEvents = response.data.events;
          const pagination = response.data.pagination;

          this.events.set(newEvents);
          this.currentPage.set(pagination.page || 1);
          this.totalPages.set(pagination.totalPages || 1);
          this.totalCount.set(pagination.total || newEvents.length);
        } else {
          this.events.set([]);
          this.totalCount.set(0);
          this.error.set('Format de réponse inattendu.');
        }

        this.loading.set(false);
      },
      error: (err: any) => {
        this.events.set([]);

        let errorMessage =
          'Impossible de charger les événements. Veuillez réessayer plus tard.';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.error.set(errorMessage);
        this.loading.set(false);
      },
    });
  }

  private loadNextPage() {
    if (this.currentPage() >= this.totalPages() || this.isLoadingMore()) {
      return;
    }

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;

    this.explorerFeedService.getAllEventsFeed(nextPage, 30, this.selectedSegment()).subscribe({
      next: (response: any) => {
        if (response.success && response.data && response.data.events) {
          const newEvents = response.data.events;
          const currentEvents = this.events();

          this.events.set([...currentEvents, ...newEvents]);
          this.currentPage.set(nextPage);
        }

        this.isLoadingMore.set(false);
      },
      error: (err: any) => {
        this.isLoadingMore.set(false);
      },
    });
  }

  refresh() {
    // Clear cache pour le filtre actuel
    this.explorerFeedService.clearCache(this.selectedSegment());
    this.currentPage.set(1);
    this.loadInitialEvents();
  }
}