import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { HistoryComponent } from './history/history.component';
import { FiltersComponent } from './feed/filters/filters.component';
import { PublicFeedService, EventSegment } from './feed/public-feed/public-feed.service';
import { CacheService } from './core/services';
import { AuthService } from './core/auth/auth.service';
import { FeedCommunicationService } from './feed/feed-communication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, HistoryComponent, FiltersComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'front';
  
  private cacheService = inject(CacheService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private feedCommService = inject(FeedCommunicationService);
  private publicFeedService = inject(PublicFeedService);
  
  hasHistory = signal(false);
  currentUrl = signal('');
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;
  
  // Données pour les filtres
  segments = signal<EventSegment[]>([]);

  ngOnInit() {
    this.checkHistory();
    this.segments.set(this.publicFeedService.getSegments());
    
    // Initialiser l'URL actuelle
    this.currentUrl.set(this.router.url);
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
        setTimeout(() => this.checkHistory(), 100);
      });
    
    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.checkHistory();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }
  
  checkHistory(): void {
    const history = this.cacheService.getViewHistory();
    this.hasHistory.set(history.length > 0);
  }
  
  
  isOnHomePage(): boolean {
    // Vérifier qu'on est sur la page d'accueil ET que l'onglet "Explorer" est actif
    const url = this.currentUrl();
    const isHomePage = url === '' || url === '/';
    const isExplorerTabActive = this.feedCommService.activeTab() === 'explorer';
    
    return isHomePage && isExplorerTabActive;
  }
  
  onSegmentsSelected(segments: string[]): void {
    this.feedCommService.setSelectedSegments(segments);
  }

  onGenresSelected(genres: string[]): void {
    this.feedCommService.setSelectedGenres(genres);
  }
  
  // Getters pour exposer les signaux du service
  get selectedSegments() { return this.feedCommService.selectedSegments; }
  get selectedGenres() { return this.feedCommService.selectedGenres; }
  get totalCount() { return this.feedCommService.totalCount; }
  get loading() { return this.feedCommService.loading; }
}
