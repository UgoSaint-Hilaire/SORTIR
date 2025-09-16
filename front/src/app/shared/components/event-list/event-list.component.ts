import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../models/event.model';
import { EventService } from '../../../events/event.service';

export interface EventListAction {
  icon: string;
  label: string;
  className?: string;
  onClick: (event: Event) => void;
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-list.component.html',
})
export class EventListComponent implements OnInit {
  @Input({ required: true }) events: Event[] = [];
  @Input() emptyMessage: string = 'Aucun événement';
  @Input() titleMaxLength: number = 25;
  @Input() locationMaxLength: number = 30;
  @Input() actions: EventListAction[] = [];
  @Input() buttonTitlePrefix: string = 'Retourner sur l\'événement';

  @Output() eventClick = new EventEmitter<Event>();

  private eventService = inject(EventService);

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

  onEventClick(event: Event): void {
    this.eventClick.emit(event);
  }

  onActionClick(action: EventListAction, event: Event): void {
    console.log('Action clicked:', action.label, 'for event:', event);
    action.onClick(event);
  }

  ngOnInit(): void {
    console.log('EventList actions:', this.actions);
    console.log('EventList events:', this.events);
  }
}