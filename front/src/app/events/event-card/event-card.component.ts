import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Event } from '../../models/event.model';
import { EventService } from '../event.service';
import { FavoritesService, AuthService } from '../../core/services';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent implements OnInit {
  @Input({ required: true }) event!: Event;
  private EventService = inject(EventService);
  private router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);

  isFavorite = signal(false);

  ngOnInit(): void {
    // Vérifier si l'événement est déjà en favoris
    this.checkIfFavorite();
    
    // S'abonner aux changements de favoris
    this.favoritesService.favorites$.subscribe(() => {
      this.checkIfFavorite();
    });
  }

  private checkIfFavorite(): void {
    const eventId = this.event._id || this.event.ticketmasterId;
    this.isFavorite.set(this.favoritesService.isEventFavoriteSync(eventId));
  }

  formatDate(date: any): string {
    return this.EventService.formatDate(date);
  }

  getEventTitle(): string {
    return this.EventService.getEventTitle(this.event);
  }

  getEventImage(): string | null {
    return this.EventService.getEventImage(this.event);
  }

  getEventLocation(): string {
    return this.EventService.getEventLocation(this.event);
  }

  getEventCategory(): string {
    return this.EventService.getEventCategory(this.event);
  }

  getEventCity(): string {
    return this.EventService.getEventCity(this.event);
  }

  navigateToDetail(): void {
    this.router.navigate([
      '/event',
      this.event._id || this.event.ticketmasterId,
    ]);
  }

  toggleFavorite(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isAuthenticated()) {
      // Demander l'ouverture de la modale de connexion
      this.authService.requestLogin();
      return;
    }

    const eventId = this.event._id || this.event.ticketmasterId;

    if (this.isFavorite()) {
      // Retirer des favoris
      this.favoritesService.removeFromFavorites(eventId).subscribe({
        next: () => {
          this.isFavorite.set(false);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression des favoris:', error);
        }
      });
    } else {
      // Ajouter aux favoris
      this.favoritesService.addToFavorites(this.event).subscribe({
        next: () => {
          this.isFavorite.set(true);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout aux favoris:', error);
        }
      });
    }
  }

  // getEventStatus(): string {
  //   return this.EventService.getEventStatus(this.event);
  // }
}
