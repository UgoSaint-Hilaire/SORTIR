import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventSegment, PublicFeedService } from '../public-feed/public-feed.service';
import { EVENT_CATEGORIES, EventCategory } from '../../shared/constants/event-categories.constants';

@Component({
  selector: 'app-filters',
  imports: [CommonModule],
  templateUrl: './filters.component.html',
  styles: [`
    .checkbox-subtle {
      --chkbg: transparent;
      --chkfg: theme(colors.primary);
      border: 1px solid theme(colors.base-300);
      opacity: 0.7;
    }
    .checkbox-subtle:checked {
      --chkbg: theme(colors.primary);
      --chkfg: theme(colors.primary-content);
      border: 1px solid theme(colors.primary);
      opacity: 1;
    }
    .checkbox-subtle.checkbox-secondary {
      --chkfg: theme(colors.secondary);
    }
    .checkbox-subtle.checkbox-secondary:checked {
      --chkbg: theme(colors.secondary);
      --chkfg: theme(colors.secondary-content);
      border: 1px solid theme(colors.secondary);
    }
  `]
})
export class FiltersComponent implements OnInit {
  private publicFeedService = inject(PublicFeedService);
  
  @Input() segments: EventSegment[] = [];
  @Input() selectedSegments: string[] = [];
  @Input() selectedGenres: string[] = [];
  @Input() totalCount: number = 0;
  @Input() loading: boolean = false;

  @Output() segmentsSelected = new EventEmitter<string[]>();
  @Output() genresSelected = new EventEmitter<string[]>();

  // Données pour les genres
  availableGenres: EventCategory[] = EVENT_CATEGORIES;
  genreCounts = signal<{ [genre: string]: number }>({});
  
  // États des accordéons
  mainFiltersAccordionOpen = signal(true); // Accordéon principal ouvert par défaut
  segmentAccordionOpen = signal(false);
  genreAccordionOpen = signal(false);

  ngOnInit() {
    this.loadGenreCounts();
  }

  loadGenreCounts(): void {
    this.publicFeedService.getGenreCounts().subscribe({
      next: (counts) => {
        this.genreCounts.set(counts);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des compteurs de genres:', error);
      }
    });
  }

  toggleMainFiltersAccordion() {
    this.mainFiltersAccordionOpen.set(!this.mainFiltersAccordionOpen());
  }

  toggleSegmentAccordion() {
    this.segmentAccordionOpen.set(!this.segmentAccordionOpen());
  }

  toggleGenreAccordion() {
    this.genreAccordionOpen.set(!this.genreAccordionOpen());
  }

  selectSegment(segment: string) {
    const currentSelected = [...this.selectedSegments];
    const index = currentSelected.indexOf(segment);
    
    if (index > -1) {
      // Désélectionner le segment
      currentSelected.splice(index, 1);
    } else {
      // Sélectionner le segment
      currentSelected.push(segment);
    }
    
    this.segmentsSelected.emit(currentSelected);
  }

  selectGenre(genre: EventCategory) {
    const currentSelected = [...this.selectedGenres];
    const index = currentSelected.indexOf(genre.name);
    
    if (index > -1) {
      // Désélectionner le genre
      currentSelected.splice(index, 1);
    } else {
      // Sélectionner le genre
      currentSelected.push(genre.name);
    }
    
    this.genresSelected.emit(currentSelected);
  }

  isSegmentSelected(segment: string): boolean {
    return this.selectedSegments.includes(segment);
  }

  isGenreSelected(genre: EventCategory): boolean {
    return this.selectedGenres.includes(genre.name);
  }

  getSelectedSegmentLabels(): string {
    const selectedLabels = this.selectedSegments
      .map(segmentName => {
        const segment = this.segments.find(s => s.name === segmentName);
        return segment ? segment.label : segmentName;
      })
      .join(', ');
    
    return selectedLabels;
  }

  getSelectedGenreLabels(): string {
    return this.selectedGenres.join(', ');
  }

  getGenreCount(genre: EventCategory): number {
    return this.genreCounts()[genre.name] || 0;
  }

  getSelectedSegmentCount(): number {
    return this.selectedSegments.length;
  }

  getSelectedGenreCount(): number {
    return this.selectedGenres.length;
  }
}