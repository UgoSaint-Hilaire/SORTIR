import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Event } from '../../models/event.model';
import { EventService } from '../event.service';
import { ConfigService } from '../../core/services';
import maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
  providers: [EventService],
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private EventService = inject(EventService);
  private configService = inject(ConfigService);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  event = signal<Event | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  isDescriptionExpanded = signal<boolean>(false);

  private map?: maplibregl.Map;

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEvent(eventId);
    }
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    const url = this.configService.getApiEndpoint(`/events/${id}`);
    console.log('Loading event from URL:', url);

    this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('Event response:', response);
        if (response.success && response.data) {
          this.event.set(response.data);
          // Initialiser la carte après le chargement de l'événement
          setTimeout(() => this.initializeMap(), 100);
        } else {
          this.error.set('Événement non trouvé');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.error.set("Impossible de charger l'événement");
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatDate(date: any): string {
    return this.EventService.formatDate(date);
  }

  getEventTitle(): string {
    return this.event() ? this.EventService.getEventTitle(this.event()!) : '';
  }

  getEventImage(): string | null {
    return this.event() ? this.EventService.getEventImage(this.event()!) : null;
  }

  getEventLocation(): string {
    return this.event()
      ? this.EventService.getEventLocation(this.event()!)
      : '';
  }

  getEventCategory(): string {
    return this.event()
      ? this.EventService.getEventCategory(this.event()!)
      : '';
  }

  getEventCity(): string {
    return this.event() ? this.EventService.getEventCity(this.event()!) : '';
  }

  shouldTruncateDescription(): boolean {
    const description = this.event()?.description;
    return description ? description.length > 400 : false;
  }

  getDisplayedDescription(): string {
    const description = this.event()?.description;
    if (!description) return '';

    if (this.shouldTruncateDescription() && !this.isDescriptionExpanded()) {
      return description.substring(0, 392); // 400 - 8 caractères pour le dégradé
    }
    return description;
  }

  getGradientText(): string {
    const description = this.event()?.description;
    if (
      !description ||
      !this.shouldTruncateDescription() ||
      this.isDescriptionExpanded()
    ) {
      return '';
    }
    return description.substring(392, 400) + '...';
  }

  toggleDescription(): void {
    this.isDescriptionExpanded.set(!this.isDescriptionExpanded());
  }

  getEventStartTime(): string {
    const event = this.event();
    if (!event?.date) return '';

    try {
      // Utiliser dateTime s'il existe, sinon combiner localDate et localTime
      const dateString =
        event.date.dateTime ||
        event.date.localDate +
          (event.date.localTime ? 'T' + event.date.localTime : '');

      if (!dateString) return '';

      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
      });
    } catch (error) {
      return '';
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    const event = this.event();
    if (
      !event?.venue?.latitude ||
      !event?.venue?.longitude ||
      !this.mapContainer
    ) {
      return;
    }

    try {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [event.venue.longitude, event.venue.latitude],
        zoom: 15,
        pitch: 45,
        bearing: 0,
      });

      this.map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      new maplibregl.Marker()
        .setLngLat([event.venue.longitude, event.venue.latitude])
        .addTo(this.map);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
    }
  }
}
