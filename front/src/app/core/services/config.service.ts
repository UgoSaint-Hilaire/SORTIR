import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = environment;

  get production(): boolean {
    return this.config.production;
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  getApiEndpoint(endpoint: string): string {
    return `${this.apiUrl}${endpoint}`;
  }

  getEnvironmentInfo(): string {
    return this.production ? 'production' : 'development';
  }
}