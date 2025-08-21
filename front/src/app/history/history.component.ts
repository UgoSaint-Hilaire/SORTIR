import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { CacheService } from '../core/services';
import { AuthService } from '../core/auth/auth.service';
import { Event } from '../models/event.model';
import { EventService } from '../events/event.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
  providers: [EventService],
})
export class HistoryComponent implements OnInit, OnDestroy {
  
  private cacheService = inject(CacheService);
  private router = inject(Router);
  private eventService = inject(EventService);
  private authService = inject(AuthService);

  history = signal<Event[]>([]);
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  ngOnInit(): void {
    this.loadHistory();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.loadHistory(), 100);
      });

    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.loadHistory();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  loadHistory(): void {
    const historyEvents = this.cacheService.getViewHistory();
    this.history.set(historyEvents);
  }

  navigateToEvent(event: Event): void {
    this.router.navigate(['/event', event._id || event.ticketmasterId]);
  }

  clearHistory(): void {
    this.cacheService.clearViewHistory();
    this.history.set([]);
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

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
