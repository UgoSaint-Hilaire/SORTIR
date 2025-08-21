import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle auth modal', () => {
    expect(component.isAuthModalOpen).toBeFalse();

    component.openAuthModal();
    expect(component.isAuthModalOpen).toBeTrue();

    component.closeAuthModal();
    expect(component.isAuthModalOpen).toBeFalse();
  });

  it('should toggle history dropdown', () => {
    expect(component.showHistoryDropdown).toBeFalse();

    component.toggleHistoryDropdown();
    expect(component.showHistoryDropdown).toBeTrue();

    component.toggleHistoryDropdown();
    expect(component.showHistoryDropdown).toBeFalse();
  });
});
