import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicFeedComponent } from '../public-feed/public-feed.component';
import { CustomFeedComponent } from '../custom-feed/custom-feed.component';
import { ExplorerFeedComponent } from '../explorer-feed/explorer-feed.component';
import { AuthService } from '../../core/auth/auth.service';
import { FeedCommunicationService } from '../feed-communication.service';

@Component({
  selector: 'app-feed-nav',
  standalone: true,
  imports: [CommonModule, PublicFeedComponent, CustomFeedComponent, ExplorerFeedComponent],
  templateUrl: './feed-nav.component.html',
})
export class FeedNavComponent implements OnInit {
  private authService = inject(AuthService);
  private feedCommService = inject(FeedCommunicationService);
  
  isAuthenticated = signal(false);
  activeTab = signal<'personal' | 'public' | 'explorer'>('public');

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated.set(isAuth);
      if (isAuth) {
        this.activeTab.set('personal');
        this.feedCommService.setActiveTab('personal');
      } else {
        this.activeTab.set('public');
        this.feedCommService.setActiveTab('public');
      }
    });
  }

  setActiveTab(tab: 'personal' | 'public' | 'explorer') {
    this.activeTab.set(tab);
    this.feedCommService.setActiveTab(tab);
  }
}
