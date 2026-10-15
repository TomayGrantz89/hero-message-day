import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Premium } from '../../services/premium';
import { Attempt } from '../../services/attempt';

interface NavItem {
  link: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './bottom-bar.html',
  styleUrls: ['./bottom-bar.scss'],
})
export class BottomBarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [];
  showPremiumModal = false;
  isPremium = false;

  private routerSubscription: Subscription | null = null;
  private premiumSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private premium: Premium,
    private attempt: Attempt
  ) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
    this.initNavItems();
    this.updateActiveRoute(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.urlAfterRedirects);
      });

    // Реактивное обновление статуса премиума (покупка в любом месте)
    this.premiumSubscription = this.premium.premiumStatus$.subscribe((status) => {
      this.isPremium = status;
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.premiumSubscription) {
      this.premiumSubscription.unsubscribe();
    }
  }

  private initNavItems(): void {
    this.navItems = [
      {
        link: '/prediction',
        icon: 'assets/ui/icon-card.svg',
        label: 'Послание дня',
        isActive: false,
      },
      {
        link: '/question',
        icon: 'assets/ui/icon-oracle.svg',
        label: 'Оракул',
        isActive: false,
      },
      {
        link: '/collection',
        icon: 'assets/ui/icon-collection.svg',
        label: 'Коллекция',
        isActive: false,
      },
      {
        link: '/shop',
        icon: 'assets/ui/icon-shop.svg',
        label: 'Магазин',
        isActive: false,
      },
    ];
  }

  private updateActiveRoute(url: string): void {
    this.navItems.forEach((item) => {
      item.isActive = url.startsWith(item.link);
    });
  }

  onNavClick(item: NavItem, event: MouseEvent): void {
    if (item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  }

  openPremiumModal(): void {
    this.showPremiumModal = true;
  }

  closePremiumModal(): void {
    this.showPremiumModal = false;
  }

  async purchasePremium(): Promise<void> {
    // Открывает шторку оплаты VK Payments (VKWebAppShowOrderBox)
    const success = await this.premium.buyFullVersion();

    if (success) {
      this.isPremium = true;
      this.attempt.refreshPredictionAttempts();
      this.attempt.refreshQuestionAttempts();
      this.closePremiumModal();
      alert('Спасибо за покупку! Полная коллекция карт разблокирована.');
    } else {
      alert('Оплата не удалась или была отменена.');
    }
  }

  async restorePurchase(): Promise<void> {
    const restored = await this.premium.restorePurchases();
    if (restored) {
      this.isPremium = true;
      this.attempt.refreshPredictionAttempts();
      this.attempt.refreshQuestionAttempts();
      this.closePremiumModal();
      alert('Покупка восстановлена. Полная коллекция карт снова доступна.');
    } else {
      alert('Покупка не найдена. Если вы оплачивали премиум, попробуйте позже.');
    }
  }
}
