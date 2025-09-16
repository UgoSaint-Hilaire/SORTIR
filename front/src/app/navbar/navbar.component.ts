import {
  Component,
  HostListener,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService, User, CacheService, FavoritesService } from '../core/services';
import { AuthComponent } from '../core/auth/auth.component';
import { EventListComponent, EventListAction } from '../shared/components/event-list/event-list.component';
import { Observable, Subscription, filter } from 'rxjs';
import { Event } from '../models/event.model';
import { EventService } from '../events/event.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, AuthComponent, EventListComponent],
  templateUrl: './navbar.component.html',
  providers: [EventService],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthModalOpen = false;
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  isScrolled = false;
  showHistoryDropdown = false;
  avatarUrl: string | null = null;

  private cacheService = inject(CacheService);
  private router = inject(Router);
  private eventService = inject(EventService);
  private favoritesService = inject(FavoritesService);

  historyEvents = signal<Event[]>([]);
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;
  private modalSubscription?: Subscription;
  private favoritesSubscription?: Subscription;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }


  openAuthModal(): void {
    this.isAuthModalOpen = true;
  }

  closeAuthModal(): void {
    this.isAuthModalOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // console.log('Déconnexion réussie');
      },
      error: (error) => {
        // console.log('Déconnexion effectuée (avec erreur serveur):', error);
      },
    });
  }

  ngOnInit(): void {
    this.loadHistory();
    this.updateAvatar();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.loadHistory(), 100);
      });

    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.loadHistory();
    });

    this.userSubscription = this.authService.currentUser$.subscribe(() => {
      this.updateAvatar();
    });

    this.modalSubscription = this.authService.openModal$.subscribe(() => {
      this.openAuthModal();
    });

    // Souscrire aux changements de favoris pour mettre à jour l'indicateur
    this.favoritesSubscription = this.favoritesService.favorites$.subscribe(() => {
      // Le template se mettra à jour automatiquement grâce à getFavoritesCount()
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.modalSubscription?.unsubscribe();
    this.favoritesSubscription?.unsubscribe();
  }

  private updateAvatar(): void {
    this.avatarUrl = this.authService.getCurrentUserAvatar({ size: 48, mood: 'happy' });
  }

  loadHistory(): void {
    const historyEvents = this.cacheService.getViewHistory();
    this.historyEvents.set(historyEvents);
  }

  navigateToEvent(event: Event): void {
    this.router.navigate(['/event', event._id || event.ticketmasterId]);
  }

  getEventTitle(event: Event): string {
    return this.eventService.getEventTitle(event);
  }

  getEventImage(event: Event): string | null {
    return this.eventService.getEventImage(event);
  }

  getEventLocation(event: Event): string {
    return this.eventService.getEventLocation(event);
  }

  formatDate(event: Event): string {
    return this.eventService.formatDate(event.date);
  }

  toggleHistoryDropdown(): void {
    this.showHistoryDropdown = !this.showHistoryDropdown;
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  getFavoritesCount(): number {
    return this.favoritesService.getFavoritesCount();
  }

  getFavoriteEvents(): Event[] {
    return this.favoritesService.getFavoriteEvents();
  }

  removeFromFavorites(event: Event): void {
    const eventId = event._id || event.ticketmasterId;
    this.favoritesService.removeFromFavorites(eventId).subscribe({
      next: () => {
        // L'indicateur se mettra à jour automatiquement grâce à l'observable
      },
      error: (error) => {
        console.error('Erreur lors de la suppression des favoris:', error);
      }
    });
  }

  getFavoritesActions(): EventListAction[] {
    return [{
      icon: `<img src="assets/icons/icons8-poubelle.svg" class="w-5 h-5" style="display: block;" />`,
      label: 'Supprimer des favoris',
      className: 'bg-red-100 hover:bg-red-200 text-red-600 border-0',
      onClick: (event: Event) => this.removeFromFavorites(event)
    }];
  }

}
