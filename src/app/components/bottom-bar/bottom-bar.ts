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

  constructor(
    private router: Router,
    private premium: Premium,
    private attempt: Attempt
  ) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
    this.initNavItems();
    this.updateActiveRoute(this.router.url);

    // Subscribe to route changes to update active state
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private initNavItems(): void {
    this.navItems = [
      {
        link: '/prediction',
        icon: 'assets/ui/icon-card.svg',
        label: 'Карта дня',
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
        link: '',
        icon: 'assets/ui/icon-shop.svg',
        label: 'Магазин',
        isActive: false,
        onClick: () => this.openPremiumModal(),
      },
    ];
  }

  private updateActiveRoute(url: string): void {
    this.navItems.forEach(item => {
      if (item.link === '') {
        item.isActive = false; // Shop never active as route
        return;
      }
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

  purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
    // Grant premium benefits
    this.attempt.refreshPredictionAttempts();
    this.attempt.refreshQuestionAttempts();
    this.closePremiumModal();
  }
}
