import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicFeedComponent } from '../public-feed/public-feed.component';

@Component({
  selector: 'app-feed-nav',
  standalone: true,
  imports: [CommonModule, PublicFeedComponent],
  templateUrl: './feed-nav.component.html',
  styleUrl: './feed-nav.component.css',
})
export class FeedNavComponent {}
