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
  currentTitle = 'Карта дня';

  private routerSubscription: Subscription | null = null;
  private indicatorSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private collectionIndicator: CollectionIndicator
  ) {}

  ngOnInit(): void {
    // Update title and indicator on route change
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateForRoute(this.router.url);
      });

    // Initial check
    this.updateForRoute(this.router.url);

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

  private updateForRoute(url: string): void {
    if (url.startsWith('/welcome')) {
      this.currentTitle = 'Добро пожаловать';
      this.showIndicator = false;
    } else if (url.startsWith('/collection')) {
      this.currentTitle = 'Коллекция';
      this.showIndicator = true;
    } else if (url.startsWith('/question')) {
      this.currentTitle = 'Оракул';
      this.showIndicator = false;
    } else {
      this.currentTitle = 'Карта дня';
      this.showIndicator = false;
    }
  }
}
