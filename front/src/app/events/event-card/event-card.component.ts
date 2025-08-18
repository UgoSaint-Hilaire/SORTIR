import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../models/event.model';
import { EventCardService } from './event-card.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
  private eventCardService = inject(EventCardService);

  formatDate(date: any): string {
    return this.eventCardService.formatDate(date);
  }

  getEventTitle(): string {
    return this.eventCardService.getEventTitle(this.event);
  }

  getEventImage(): string | null {
    return this.eventCardService.getEventImage(this.event);
  }

  getEventLocation(): string {
    return this.eventCardService.getEventLocation(this.event);
  }

  getEventCategory(): string {
    return this.eventCardService.getEventCategory(this.event);
  }

  // getEventStatus(): string {
  //   return this.eventCardService.getEventStatus(this.event);
  // }
}
