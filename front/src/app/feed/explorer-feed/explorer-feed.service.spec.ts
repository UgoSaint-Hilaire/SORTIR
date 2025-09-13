import { TestBed } from '@angular/core/testing';

import { ExplorerFeedService } from './explorer-feed.service';

describe('ExplorerFeedService', () => {
  let service: ExplorerFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExplorerFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
