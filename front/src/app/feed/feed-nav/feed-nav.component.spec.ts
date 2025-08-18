import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FeedNavComponent } from './feed-nav.component';

describe('FeedNavComponent', () => {
  let component: FeedNavComponent;
  let fixture: ComponentFixture<FeedNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedNavComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
