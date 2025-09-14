import { Component, OnInit, OnDestroy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../events/event-card/event-card.component';
import { FiltersComponent } from '../filters/filters.component';
import { PublicFeedService, EventSegment } from '../public-feed/public-feed.service';
import { ExplorerFeedService } from './explorer-feed.service';
import { Event } from '../../models/event.model';
import { ConfigService } from '../../core/services';
import { FeedCommunicationService } from '../feed-communication.service';

@Component({
  selector: 'app-explorer-feed',
  standalone: true,
  imports: [CommonModule, EventCardComponent, FiltersComponent],
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
  selectedSegments = signal<string[]>([]);
  selectedGenres = signal<string[]>([]);
  

  constructor() {
    // Écouter les changements du service de communication pour les segments
    effect(() => {
      const newSegments = this.feedCommService.selectedSegments();
      if (JSON.stringify(newSegments) !== JSON.stringify(this.selectedSegments())) {
        this.selectedSegments.set(newSegments);
        this.currentPage.set(1);
        this.events.set([]);
        // Clear cache pour ce filtre spécifique quand on change
        this.explorerFeedService.clearCache(newSegments, this.selectedGenres());
        this.loadInitialEvents();
      }
    });

    // Écouter les changements du service de communication pour les genres
    effect(() => {
      const newGenres = this.feedCommService.selectedGenres();
      if (JSON.stringify(newGenres) !== JSON.stringify(this.selectedGenres())) {
        this.selectedGenres.set(newGenres);
        this.currentPage.set(1);
        this.events.set([]);
        // Clear cache pour ce filtre spécifique quand on change
        this.explorerFeedService.clearCache(this.selectedSegments(), newGenres);
        this.loadInitialEvents();
      }
    });
    
    // Synchroniser l'état local avec le service
    effect(() => {
      this.feedCommService.updateFeedData({
        selectedSegments: this.selectedSegments(),
        selectedGenres: this.selectedGenres(),
        totalCount: this.totalCount(),
        loading: this.loading()
      });
    });
  }

  private scrollHandler?: () => void;

  ngOnInit() {
    this.segments.set(this.publicFeedService.getSegments());
    
    // Récupérer l'état des filtres persistés depuis le service
    const persistedSegments = this.feedCommService.selectedSegments();
    const persistedGenres = this.feedCommService.selectedGenres();
    this.selectedSegments.set(persistedSegments);
    this.selectedGenres.set(persistedGenres);
    
    this.loadInitialEvents();
    this.initializeScrollListener();
  }

  ngOnDestroy() {
    this.removeScrollListener();
  }

  onSegmentsSelected(segments: string[]) {
    // Mettre à jour le service de communication au lieu des signaux locaux
    // L'effect se chargera de la mise à jour et du rechargement
    this.feedCommService.setSelectedSegments(segments);
  }

  onGenresSelected(genres: string[]) {
    // Mettre à jour le service de communication au lieu des signaux locaux
    // L'effect se chargera de la mise à jour et du rechargement
    this.feedCommService.setSelectedGenres(genres);
  }

  getSelectedSegmentLabels(): string {
    const selectedLabels = this.selectedSegments()
      .map(segmentName => {
        const segment = this.segments().find(s => s.name === segmentName);
        return segment ? segment.label : segmentName;
      })
      .join(', ');
    
    return selectedLabels;
  }

  getSelectedGenreLabels(): string {
    return this.selectedGenres().join(', ');
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
    this.explorerFeedService.getAllEventsFeed(1, 30, this.selectedSegments(), this.selectedGenres()).subscribe({
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

    this.explorerFeedService.getAllEventsFeed(nextPage, 30, this.selectedSegments(), this.selectedGenres()).subscribe({
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
    this.explorerFeedService.clearCache(this.selectedSegments(), this.selectedGenres());
    this.currentPage.set(1);
    this.loadInitialEvents();
  }
}