import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService } from '../auth/auth.service';
import { Event } from '../../models/event.model';

export interface Favorite {
  id: number;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  eventImage: string;
  eventUrl: string;
  createdAt: string;
}

export interface FavoriteEventData {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  eventImage: string;
  eventUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    // Charger les favoris au démarrage si l'utilisateur est connecté
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadFavorites().subscribe();
      } else {
        this.favoritesSubject.next([]);
      }
    });
  }

  addToFavorites(event: Event): Observable<any> {
    const eventData: FavoriteEventData = {
      eventId: event._id || event.ticketmasterId,
      eventName: event.name,
      eventDate: event.date?.localDate || '',
      eventVenue: event.venue?.name || '',
      eventCity: event.venue?.city || '',
      eventImage: event.images?.[0]?.url || '',
      eventUrl: event.url
    };

    return this.http.post(
      this.configService.getApiEndpoint('/users/favorites'),
      eventData,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Recharger les favoris après ajout
        this.loadFavorites().subscribe();
      })
    );
  }

  removeFromFavorites(eventId: string): Observable<any> {
    return this.http.delete(
      this.configService.getApiEndpoint(`/users/favorites/${eventId}`),
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Mettre à jour la liste locale
        const currentFavorites = this.favoritesSubject.value;
        const updatedFavorites = currentFavorites.filter(fav => fav.eventId !== eventId);
        this.favoritesSubject.next(updatedFavorites);
      })
    );
  }

  loadFavorites(): Observable<any> {
    return this.http.get(
      this.configService.getApiEndpoint('/users/favorites'),
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          this.favoritesSubject.next(response.favorites);
        }
      })
    );
  }

  isEventInFavorites(eventId: string): Observable<boolean> {
    return this.http.get<any>(
      this.configService.getApiEndpoint(`/users/favorites/${eventId}`),
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      tap(response => {
        // Juste pour le débogage, la valeur est déjà retournée par l'observable
        console.log('Is favorite response:', response.isFavorite);
      }),
      // Extraire la valeur isFavorite de la réponse
      map(response => response.isFavorite)
    );
  }

  // Méthode synchrone pour vérifier si un événement est en favoris
  isEventFavoriteSync(eventId: string): boolean {
    const favorites = this.favoritesSubject.value;
    return favorites.some(fav => fav.eventId === eventId);
  }

  getFavorites(): Favorite[] {
    return this.favoritesSubject.value;
  }

  getFavoritesCount(): number {
    return this.favoritesSubject.value.length;
  }

  getFavoriteEvents(): Event[] {
    return this.favoritesSubject.value.map(favorite => ({
      _id: favorite.eventId,
      ticketmasterId: favorite.eventId,
      name: favorite.eventName,
      date: { localDate: favorite.eventDate },
      venue: { 
        name: favorite.eventVenue,
        city: favorite.eventCity
      },
      images: favorite.eventImage ? [{ url: favorite.eventImage }] : [],
      url: favorite.eventUrl
    } as Event));
  }
}