import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TopBarComponent } from './components/top-bar/top-bar';
import { BottomBarComponent } from './components/bottom-bar/bottom-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, TopBarComponent, BottomBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  showBottomBar = true;

  /** Startup splash overlay visibility */
  splashVisible = true;
  /** Logo fade-in state (appears immediately) */
  splashLogoVisible = false;
  /** Studio caption fade-in state (appears at 1s) */
  splashCaptionVisible = false;

  /** Constants for splash timing (ms) */
  private readonly SPLASH_CAPTION_DELAY = 1000;
  private readonly SPLASH_HIDE_DELAY = 3000;

  private routerSubscription: Subscription | null = null;
  private splashTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startSplashSequence();

    // Hide bottom bar on welcome page
    this.showBottomBar = this.router.url !== '/welcome';
    this.updateBodyClass(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showBottomBar = event.urlAfterRedirects !== '/welcome';
        this.updateBodyClass(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Clear any pending splash timers
    this.splashTimers.forEach(timer => clearTimeout(timer));
    this.splashTimers = [];
  }

  /**
   * Run the startup splash animation sequence:
   *  - Logo appears immediately (t=0)
   *  - Caption "разработано в студии Золотой Заяц" appears at 1s
   *  - Overlay fades out at 3s, revealing the app underneath
   *
   * Note: the app runs zoneless (no Zone.js), so setTimeout callbacks
   * must call markForCheck() to trigger change detection after mutating state.
   */
  private startSplashSequence(): void {
    // Show logo right away
    this.splashLogoVisible = true;

    // Show caption at 1s
    this.splashTimers.push(
      setTimeout(() => {
        this.splashCaptionVisible = true;
        this.cdr.markForCheck();
      }, this.SPLASH_CAPTION_DELAY)
    );

    // Start hiding the overlay at 3s (fade-out handled by CSS transition)
    this.splashTimers.push(
      setTimeout(() => {
        this.splashVisible = false;
        this.cdr.markForCheck();
      }, this.SPLASH_HIDE_DELAY)
    );
  }

  private updateBodyClass(url: string): void {
    if (url === '/welcome') {
      document.body.classList.add('welcome-active');
    } else {
      document.body.classList.remove('welcome-active');
    }
  }
}
