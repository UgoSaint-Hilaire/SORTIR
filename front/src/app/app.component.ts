import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { HistoryComponent } from './history/history.component';
import { CacheService } from './core/services';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, HistoryComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'front';
  
  private cacheService = inject(CacheService);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  hasHistory = signal(false);
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  ngOnInit() {
    this.checkHistory();
    
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.checkHistory(), 100);
      });
    
    this.authSubscription = this.authService.isAuthenticated$.subscribe(() => {
      this.checkHistory();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }
  
  checkHistory(): void {
    const history = this.cacheService.getViewHistory();
    this.hasHistory.set(history.length > 0);
  }
}
