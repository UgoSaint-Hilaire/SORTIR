import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Event } from '../../models/event.model';
import { EventService } from '../event.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
  private EventService = inject(EventService);
  private router = inject(Router);

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

  navigateToDetail(): void {
    this.router.navigate([
      '/event',
      this.event._id || this.event.ticketmasterId,
    ]);
  }

  // getEventStatus(): string {
  //   return this.EventService.getEventStatus(this.event);
  // }
}
