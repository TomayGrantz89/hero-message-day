import { Component, OnInit, OnDestroy } from '@angular/core';
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

  private routerSubscription: Subscription | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
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
  }

  private updateBodyClass(url: string): void {
    if (url === '/welcome') {
      document.body.classList.add('welcome-active');
    } else {
      document.body.classList.remove('welcome-active');
    }
  }
}
