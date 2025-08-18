import { Injectable } from '@angular/core';
import { Event } from '../../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventCardService {
  formatDate(date: any): string {
    if (!date) return 'Date non disponible';

    // Gérer le format MongoDB avec localDate et localTime
    if (date.localDate) {
      let dateString = date.localDate;
      if (date.localTime) {
        dateString += 'T' + date.localTime;
      }
      const eventDate = new Date(dateString);

      if (isNaN(eventDate.getTime())) {
        return 'Date non disponible';
      }

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return eventDate.toLocaleDateString('fr-FR', options);
    }

    // Fallback pour les autres formats
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return 'Date non disponible';
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return eventDate.toLocaleDateString('fr-FR', options);
  }

  getEventTitle(event: Event): string {
    return event.name || 'Événement sans titre';
  }

  getEventImage(event: Event): string | null {
    if (event.images && event.images.length > 0) {
      return event.images[0].url || null;
    }
    return null;
  }

  getEventLocation(event: Event): string {
    if (event.venue) {
      const parts = [];
      if (event.venue.name) parts.push(event.venue.name);
      if (event.venue.city) parts.push(event.venue.city);
      return parts.join(', ') || 'Lieu non défini';
    }
    return 'Lieu non défini';
  }

  getEventCategory(event: Event): string {
    return event.segment || event.genre || 'Événement';
  }

  getEventPrice(event: Event): {
    hasPrice: boolean;
    price?: number;
    currency?: string;
  } {
    if (event.priceRange) {
      const min = event.priceRange.min;
      const currency = event.priceRange.currency || 'EUR';
      if (min !== undefined && min !== null) {
        return { hasPrice: true, price: min, currency };
      }
    }
    return { hasPrice: false };
  }

  getEventStatus(event: Event): string {
    const status = event.status;
    switch (status) {
      case 'onsale':
        return 'En vente';
      case 'offsale':
        return 'Vente fermée';
      case 'cancelled':
        return 'Annulé';
      default:
        return status || 'Statut inconnu';
    }
  }
}
