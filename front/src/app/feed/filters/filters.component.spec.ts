import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { FiltersComponent } from './filters.component';
import { PublicFeedService, EventSegment } from '../public-feed/public-feed.service';
import { EVENT_CATEGORIES } from '../../shared/constants/event-categories.constants';

describe('FiltersComponent', () => {
  let component: FiltersComponent;
  let fixture: ComponentFixture<FiltersComponent>;
  let mockPublicFeedService: jasmine.SpyObj<PublicFeedService>;

  const mockSegments: EventSegment[] = [
    { id: 'Musique', name: 'Musique', label: 'Musique' },
    { id: 'Sports', name: 'Sports', label: 'Sports' },
    { id: 'Arts et théâtre', name: 'Arts et théâtre', label: 'Arts & Théâtre' }
  ];

  const mockGenreCounts = {
    'Rock': 5,
    'Football': 8,
    'Jazz': 3,
    'Théâtre': 4
  };

  beforeEach(async () => {
    const publicFeedSpy = jasmine.createSpyObj('PublicFeedService', ['getGenreCounts']);
    publicFeedSpy.getGenreCounts.and.returnValue(of(mockGenreCounts));

    await TestBed.configureTestingModule({
      imports: [FiltersComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: PublicFeedService, useValue: publicFeedSpy }
      ]
    })
    .compileComponents();

    mockPublicFeedService = TestBed.inject(PublicFeedService) as jasmine.SpyObj<PublicFeedService>;

    fixture = TestBed.createComponent(FiltersComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.segments = [];
    component.selectedSegments = [];
    component.selectedGenres = [];
    component.totalCount = 0;
    component.loading = false;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty segments and genres', () => {
    expect(component.selectedSegments).toEqual([]);
    expect(component.selectedGenres).toEqual([]);
    expect(component.totalCount).toBe(0);
    expect(component.loading).toBe(false);
  });

  it('should have available genres from constants', () => {
    expect(component.availableGenres).toBeDefined();
    expect(component.availableGenres).toEqual(EVENT_CATEGORIES);
    expect(component.availableGenres.length).toBeGreaterThan(0);
  });

  it('should load genre counts on init', () => {
    expect(mockPublicFeedService.getGenreCounts).toHaveBeenCalled();
    expect(component.genreCounts()).toEqual(mockGenreCounts);
  });

  it('should select segment correctly', () => {
    spyOn(component.segmentsSelected, 'emit');
    
    component.selectSegment('Musique');
    
    expect(component.segmentsSelected.emit).toHaveBeenCalledWith(['Musique']);
  });

  it('should deselect segment correctly', () => {
    component.selectedSegments = ['Musique', 'Sports'];
    spyOn(component.segmentsSelected, 'emit');
    
    component.selectSegment('Musique');
    
    expect(component.segmentsSelected.emit).toHaveBeenCalledWith(['Sports']);
  });

  it('should select genre correctly', () => {
    spyOn(component.genresSelected, 'emit');
    const rockGenre = EVENT_CATEGORIES.find(g => g.name === 'Rock')!;
    
    component.selectGenre(rockGenre);
    
    expect(component.genresSelected.emit).toHaveBeenCalledWith(['Rock']);
  });

  it('should deselect genre correctly', () => {
    component.selectedGenres = ['Rock', 'Jazz'];
    spyOn(component.genresSelected, 'emit');
    const rockGenre = EVENT_CATEGORIES.find(g => g.name === 'Rock')!;
    
    component.selectGenre(rockGenre);
    
    expect(component.genresSelected.emit).toHaveBeenCalledWith(['Jazz']);
  });

  it('should check if segment is selected', () => {
    component.selectedSegments = ['Musique'];
    
    expect(component.isSegmentSelected('Musique')).toBe(true);
    expect(component.isSegmentSelected('Sports')).toBe(false);
  });

  it('should check if genre is selected', () => {
    component.selectedGenres = ['Rock'];
    const rockGenre = EVENT_CATEGORIES.find(g => g.name === 'Rock')!;
    const jazzGenre = EVENT_CATEGORIES.find(g => g.name === 'Jazz')!;
    
    expect(component.isGenreSelected(rockGenre)).toBe(true);
    expect(component.isGenreSelected(jazzGenre)).toBe(false);
  });

  it('should get genre count from signal', () => {
    const rockGenre = EVENT_CATEGORIES.find(g => g.name === 'Rock')!;
    
    expect(component.getGenreCount(rockGenre)).toBe(5);
  });

  it('should get selected segment count', () => {
    component.selectedSegments = ['Musique', 'Sports'];
    
    expect(component.getSelectedSegmentCount()).toBe(2);
  });

  it('should get selected genre count', () => {
    component.selectedGenres = ['Rock', 'Jazz', 'Football'];
    
    expect(component.getSelectedGenreCount()).toBe(3);
  });

  it('should get selected segment labels', () => {
    component.segments = mockSegments;
    component.selectedSegments = ['Musique', 'Sports'];
    
    expect(component.getSelectedSegmentLabels()).toBe('Musique, Sports');
  });

  it('should get selected genre labels', () => {
    component.selectedGenres = ['Rock', 'Jazz'];
    
    expect(component.getSelectedGenreLabels()).toBe('Rock, Jazz');
  });

  it('should toggle accordions', () => {
    const initialMainState = component.mainFiltersAccordionOpen();
    const initialSegmentState = component.segmentAccordionOpen();
    const initialGenreState = component.genreAccordionOpen();
    
    component.toggleMainFiltersAccordion();
    component.toggleSegmentAccordion();
    component.toggleGenreAccordion();
    
    expect(component.mainFiltersAccordionOpen()).toBe(!initialMainState);
    expect(component.segmentAccordionOpen()).toBe(!initialSegmentState);
    expect(component.genreAccordionOpen()).toBe(!initialGenreState);
  });
});
