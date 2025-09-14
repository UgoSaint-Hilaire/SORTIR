import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { ExplorerFeedComponent } from './explorer-feed.component';
import { PublicFeedService } from '../public-feed/public-feed.service';
import { ExplorerFeedService } from './explorer-feed.service';
import { FeedCommunicationService } from '../feed-communication.service';
import { ConfigService } from '../../core/services';

describe('ExplorerFeedComponent', () => {
  let component: ExplorerFeedComponent;
  let fixture: ComponentFixture<ExplorerFeedComponent>;
  let mockPublicFeedService: jasmine.SpyObj<PublicFeedService>;
  let mockExplorerFeedService: jasmine.SpyObj<ExplorerFeedService>;
  let mockFeedCommunicationService: jasmine.SpyObj<FeedCommunicationService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    const publicFeedSpy = jasmine.createSpyObj('PublicFeedService', ['getSegments', 'getGenreCounts']);
    const explorerFeedSpy = jasmine.createSpyObj('ExplorerFeedService', ['getAllEventsFeed', 'clearCache']);
    const feedCommSpy = jasmine.createSpyObj('FeedCommunicationService', [
      'selectedSegments', 'selectedGenres', 'setSelectedSegments', 'setSelectedGenres', 'updateFeedData'
    ]);
    const configSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);

    // Setup signal returns
    Object.defineProperty(feedCommSpy, 'selectedSegments', {
      get: () => signal([])
    });
    Object.defineProperty(feedCommSpy, 'selectedGenres', {
      get: () => signal([])
    });

    publicFeedSpy.getSegments.and.returnValue([]);
    publicFeedSpy.getGenreCounts.and.returnValue(of({}));
    explorerFeedSpy.getAllEventsFeed.and.returnValue(of({
      success: true,
      data: {
        events: [],
        pagination: { total: 0, page: 1, limit: 30, totalPages: 0, hasNext: false, hasPrev: false }
      }
    }));

    await TestBed.configureTestingModule({
      imports: [ExplorerFeedComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: PublicFeedService, useValue: publicFeedSpy },
        { provide: ExplorerFeedService, useValue: explorerFeedSpy },
        { provide: FeedCommunicationService, useValue: feedCommSpy },
        { provide: ConfigService, useValue: configSpy }
      ]
    })
    .compileComponents();

    mockPublicFeedService = TestBed.inject(PublicFeedService) as jasmine.SpyObj<PublicFeedService>;
    mockExplorerFeedService = TestBed.inject(ExplorerFeedService) as jasmine.SpyObj<ExplorerFeedService>;
    mockFeedCommunicationService = TestBed.inject(FeedCommunicationService) as jasmine.SpyObj<FeedCommunicationService>;
    mockConfigService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;

    fixture = TestBed.createComponent(ExplorerFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty events', () => {
    expect(component.events()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(1);
  });

  it('should load segments from public feed service', () => {
    expect(mockPublicFeedService.getSegments).toHaveBeenCalled();
  });

  it('should call explorer feed service on segment selection', () => {
    component.onSegmentsSelected(['Musique']);
    
    expect(mockFeedCommunicationService.setSelectedSegments).toHaveBeenCalledWith(['Musique']);
  });

  it('should call explorer feed service on genre selection', () => {
    component.onGenresSelected(['Rock']);
    
    expect(mockFeedCommunicationService.setSelectedGenres).toHaveBeenCalledWith(['Rock']);
  });

  it('should refresh and clear cache', () => {
    component.refresh();
    
    expect(mockExplorerFeedService.clearCache).toHaveBeenCalled();
    expect(component.currentPage()).toBe(1);
  });
});
