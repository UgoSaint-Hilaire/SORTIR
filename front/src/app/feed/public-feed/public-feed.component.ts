import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCardComponent } from '../../events/event-card/event-card.component';
import { PublicFeedService } from './public-feed.service';
import { Event } from '../../models/event.model';
import { ConfigService } from '../../core/services';

@Component({
  selector: 'app-public-feed',
  standalone: true,
  imports: [CommonModule, EventCardComponent],
  templateUrl: './public-feed.component.html',
})
export class PublicFeedComponent implements OnInit, OnDestroy {
  private publicFeedService = inject(PublicFeedService);
  public configService = inject(ConfigService);

  events = signal<Event[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  isLoadingMore = signal(false);
  hasAllEventsLoaded = signal(false);

  private scrollHandler?: () => void;

  ngOnInit() {
    this.loadInitialEvents();
    this.initializeScrollListener();
  }

  ngOnDestroy() {
    this.removeScrollListener();
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

    this.publicFeedService.getPublicFeed(1, 30).subscribe({
      next: (response: any) => {
        // console.log('Chargement initial - API Response:', response);

        if (!response.success) {
          // console.error(
          //   'API returned error:',
          //   response.message || 'Unknown error'
          // );
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

          const cachedEvents = this.publicFeedService.getPublicCachedEvents();
          this.hasAllEventsLoaded.set(!!cachedEvents);
        } else {
          this.events.set([]);
          this.totalCount.set(0);
          this.error.set('Format de réponse inattendu.');
        }

        this.loading.set(false);
      },
      error: (err: any) => {
        // console.error('Erreur lors du chargement initial:', err);
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

    this.publicFeedService.getPublicFeed(nextPage, 30).subscribe({
      next: (response: any) => {
        // console.log(
        //   `Chargement page ${nextPage} - Cache hit:`,
        //   response.data ? 'Oui' : 'Non'
        // );

        if (response.success && response.data && response.data.events) {
          const newEvents = response.data.events;
          const currentEvents = this.events();

          this.events.set([...currentEvents, ...newEvents]);
          this.currentPage.set(nextPage);

          // console.log(
          //   `Page ${nextPage} chargée, ${newEvents.length} nouveaux événements`
          // );
        }

        this.isLoadingMore.set(false);
      },
      error: (err: any) => {
        // console.error(`Erreur chargement page ${nextPage}:`, err);
        this.isLoadingMore.set(false);
      },
    });
  }

  refresh() {
    this.publicFeedService.clearPublicEventsCache();
    this.currentPage.set(1);
    this.hasAllEventsLoaded.set(false);
    this.loadInitialEvents();
  }
}
