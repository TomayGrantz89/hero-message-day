import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CollectionIndicator } from '../../services/collection-indicator';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './top-bar.html',
  styleUrls: ['./top-bar.scss'],
})
export class TopBarComponent implements OnInit, OnDestroy {
  showIndicator = false;
  indicatorText = '';

  private routerSubscription: Subscription | null = null;
  private indicatorSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private collectionIndicator: CollectionIndicator
  ) {}

  ngOnInit(): void {
    // Detect route changes to show/hide the indicator
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showIndicator = this.router.url.startsWith('/collection');
      });

    // Initial check
    this.showIndicator = this.router.url.startsWith('/collection');

    // Subscribe to indicator text updates
    this.indicatorSubscription = this.collectionIndicator.indicator$.subscribe(text => {
      this.indicatorText = text;
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.indicatorSubscription) {
      this.indicatorSubscription.unsubscribe();
    }
  }
}
