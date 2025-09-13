import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventSegment } from '../public-feed/public-feed.service';

@Component({
  selector: 'app-filters',
  imports: [CommonModule],
  templateUrl: './filters.component.html'
})
export class FiltersComponent {
  @Input() segments: EventSegment[] = [];
  @Input() selectedSegment: string | null = null;
  @Input() totalCount: number = 0;
  @Input() loading: boolean = false;

  @Output() segmentSelected = new EventEmitter<string | null>();

  selectSegment(segment: string | null) {
    // Si on clique sur le segment déjà sélectionné, on le désélectionne
    const newSegment = this.selectedSegment === segment ? null : segment;
    this.segmentSelected.emit(newSegment);
  }

  getSelectedSegmentLabel(): string {
    const segment = this.segments.find(s => s.name === this.selectedSegment);
    return segment ? segment.label : '';
  }
}