import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BottomBarComponent } from './components/bottom-bar/bottom-bar';
import { VkBridgeService } from './services/vk-bridge.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, BottomBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  showBottomBar = true;

  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private vk: VkBridgeService
  ) {}

  ngOnInit(): void {
    // Инициализация VK Mini Apps: VKWebAppInit + тема. Вне VK — no-op.
    this.vk.init();

    // Нижняя навигация скрыта только на странице приветствия
    this.showBottomBar = this.router.url !== '/welcome';

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showBottomBar = event.urlAfterRedirects !== '/welcome';
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
