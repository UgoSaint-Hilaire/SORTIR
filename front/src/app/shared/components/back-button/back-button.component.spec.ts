import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { BackButtonComponent } from './back-button.component';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockLocation = jasmine.createSpyObj('Location', ['back']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BackButtonComponent],
      providers: [
        { provide: Location, useValue: mockLocation },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render back button with correct text', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('button').textContent.trim()).toBe('Retour arrière');
  });

  it('should call location.back() when history exists', () => {
    // Simuler qu'il y a de l'historique
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true
    });

    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to home when no history exists', () => {
    // Simuler qu'il n'y a pas d'historique
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true
    });

    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    expect(mockLocation.back).not.toHaveBeenCalled();
  });

  it('should call goBack when button is clicked', () => {
    spyOn(component, 'goBack');
    const button = fixture.nativeElement.querySelector('button');
    
    button.click();

    expect(component.goBack).toHaveBeenCalled();
  });
});