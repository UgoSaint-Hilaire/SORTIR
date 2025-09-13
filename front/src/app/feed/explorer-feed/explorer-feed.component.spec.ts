import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorerFeedComponent } from './explorer-feed.component';

describe('ExplorerFeedComponent', () => {
  let component: ExplorerFeedComponent;
  let fixture: ComponentFixture<ExplorerFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorerFeedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExplorerFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
