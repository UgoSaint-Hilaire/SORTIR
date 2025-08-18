import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicFeedComponent } from './public-feed.component';

describe('PublicFeedComponent', () => {
  let component: PublicFeedComponent;
  let fixture: ComponentFixture<PublicFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicFeedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
