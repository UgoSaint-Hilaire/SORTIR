import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { PreferencesService } from './preferences.service';
import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/auth/auth.service';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const configSpy = jasmine.createSpyObj('ConfigService', ['getApiEndpoint']);
    const authSpy = jasmine.createSpyObj('AuthService', [
      'getAuthHeaders',
      'updateUserPreferences',
      'getUserPreferences',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PreferencesService,
        { provide: ConfigService, useValue: configSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    });

    service = TestBed.inject(PreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(
      ConfigService
    ) as jasmine.SpyObj<ConfigService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return categories by segment', () => {
    const musicCategories = service.getCategoriesBySegment('music');
    const sportsCategories = service.getCategoriesBySegment('sports');
    const artsCategories = service.getCategoriesBySegment('arts');

    expect(musicCategories.length).toBeGreaterThan(0);
    expect(sportsCategories.length).toBeGreaterThan(0);
    expect(artsCategories.length).toBeGreaterThan(0);

    expect(
      musicCategories.every((cat) => cat.segment === 'music')
    ).toBeTruthy();
    expect(
      sportsCategories.every((cat) => cat.segment === 'sports')
    ).toBeTruthy();
    expect(artsCategories.every((cat) => cat.segment === 'arts')).toBeTruthy();
  });

  it('should create preferences', () => {
    const mockResponse = { success: true, message: 'Preferences created' };
    const preferences = ['Rock', 'Jazz'];

    configService.getApiEndpoint.and.returnValue('/api/users/preferences');
    authService.getAuthHeaders.and.returnValue(new HttpHeaders());

    service.createPreferences(preferences).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/api/users/preferences');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ classificationNames: preferences });
    req.flush(mockResponse);
  });

  it('should delete preference', () => {
    const preferenceId = 1;

    configService.getApiEndpoint.and.returnValue('/api/users/preferences/1');
    authService.getAuthHeaders.and.returnValue(new HttpHeaders());
    authService.getUserPreferences.and.returnValue([]);

    service.deletePreference(preferenceId).subscribe();

    const req = httpMock.expectOne('/api/users/preferences/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
