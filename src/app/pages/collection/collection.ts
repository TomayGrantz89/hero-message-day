import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CardData, Card } from '../../services/card-data';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';
import { CollectionIndicator } from '../../services/collection-indicator';

type CardState = 'owned' | 'available' | 'locked';

interface CollectionCard {
  card: Card | null;
  owned: boolean;
  state: CardState;
  isPlaceholder?: boolean;
}

@Component({
  selector: 'app-collection',
  imports: [CommonModule],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection implements OnInit, OnDestroy {
  collectionCards: CollectionCard[] = [];
  selectedCard: Card | null = null;
  showDetail = false;
  detailSide: 'face' | 'back' = 'face';

  // Premium status
  isPremium = false;
  showPremiumMessage = false;

  // Swipe/carousel properties
  currentSwipePage = 0;
  cardsPerSwipe = 6; // Default for mobile portrait (3 columns × 2 rows)
  swipePages: CollectionCard[][] = [];

  // Touch tracking
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;

  // Premium status subscription
  private premiumSubscription: Subscription | null = null;

  constructor(
    private cardData: CardData,
    private attemptService: Attempt,
    private premium: Premium,
    private collectionIndicator: CollectionIndicator
  ) {}

  ngOnInit(): void {
    this.calculateCardsPerSwipe();
    this.updatePremiumStatus();
    this.loadCollection();
    this.updateIndicator();

    // Subscribe to premium status changes (e.g., purchased from bottom-bar shop)
    this.premiumSubscription = this.premium.premiumStatus$.subscribe(isPremium => {
      const wasPremium = this.isPremium;
      this.isPremium = isPremium;
      this.showPremiumMessage = false;
      if (isPremium && !wasPremium) {
        // Premium was just activated from another page — refresh attempts
        this.attemptService.refreshPredictionAttempts();
        this.attemptService.refreshQuestionAttempts();
      }
      this.loadCollection();
    });
  }

  ngOnDestroy(): void {
    if (this.premiumSubscription) {
      this.premiumSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:orientationchange')
  onResize(): void {
    this.calculateCardsPerSwipe();
    this.buildSwipePages();
    // Ensure current page is still valid
    if (this.currentSwipePage >= this.swipePages.length && this.swipePages.length > 0) {
      this.currentSwipePage = this.swipePages.length - 1;
    }
    this.updateIndicator();
  }

  private calculateCardsPerSwipe(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isMobile = width < 768;

    if (isMobile) {
      if (isLandscape) {
        this.cardsPerSwipe = 8; // 4 columns × 2 rows
      } else {
        this.cardsPerSwipe = 9; // 3 columns × 3 rows
      }
    } else {
      // Desktop — not used for swipe, but set a default
      this.cardsPerSwipe = 14;
    }
  }

  private loadCollection(): void {
    const collectedIds = this.attemptService.getCollection();
    const allCards = this.cardData.getAllCards();
    const isPremium = this.isPremium;

    this.collectionCards = allCards.map(card => {
      const owned = collectedIds.includes(card.id);
      let state: CardState;

      if (owned) {
        state = 'owned';
      } else if (isPremium) {
        // Premium: all unowned cards show as card back (available)
        state = 'available';
      } else {
        // Non-premium: cards 1-14 are available, 15-64 are locked
        state = card.id <= 14 ? 'available' : 'locked';
      }

      return { card, owned, state };
    });

    this.buildSwipePages();
  }

  private buildSwipePages(): void {
    this.swipePages = [];
    for (let i = 0; i < this.collectionCards.length; i += this.cardsPerSwipe) {
      this.swipePages.push(this.collectionCards.slice(i, i + this.cardsPerSwipe));
    }

    // Pad the last page with invisible placeholders to maintain grid spacing
    const lastPage = this.swipePages[this.swipePages.length - 1];
    if (lastPage && lastPage.length < this.cardsPerSwipe) {
      const placeholdersNeeded = this.cardsPerSwipe - lastPage.length;
      for (let p = 0; p < placeholdersNeeded; p++) {
        lastPage.push({ card: null, owned: false, state: 'locked', isPlaceholder: true });
      }
    }

    // Reset to first page if current is out of bounds
    if (this.currentSwipePage >= this.swipePages.length && this.swipePages.length > 0) {
      this.currentSwipePage = this.swipePages.length - 1;
    } else if (this.currentSwipePage < 0) {
      this.currentSwipePage = 0;
    }
  }

  private updatePremiumStatus(): void {
    this.isPremium = this.premium.isPremium();
    this.showPremiumMessage = false;
  }

  // Swipe handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent): void {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > this.SWIPE_THRESHOLD) {
      if (diff > 0 && this.currentSwipePage < this.swipePages.length - 1) {
        this.currentSwipePage++; // Swipe left — next page
      } else if (diff < 0 && this.currentSwipePage > 0) {
        this.currentSwipePage--; // Swipe right — previous page
      }
    }
    this.updateIndicator();
  }

  // Indicator getters
  get currentRangeStart(): number {
    if (this.collectionCards.length === 0) return 0;
    return this.currentSwipePage * this.cardsPerSwipe + 1;
  }

  get currentRangeEnd(): number {
    const end = (this.currentSwipePage + 1) * this.cardsPerSwipe;
    return Math.min(end, this.collectionCards.length);
  }

  get totalCardsCount(): number {
    return this.collectionCards.length;
  }

  private updateIndicator(): void {
    if (this.collectionCards.length === 0) {
      this.collectionIndicator.setIndicatorText('');
      return;
    }
    const text = `${this.currentRangeStart}-${this.currentRangeEnd} из ${this.totalCardsCount}`;
    this.collectionIndicator.setIndicatorText(text);
  }

  selectCard(item: CollectionCard): void {
    if (item.state !== 'owned') {
      return; // Only owned cards can be opened
    }
    this.selectedCard = item.card;
    this.showDetail = true;
    this.detailSide = 'face';
  }

  onLockClick(event: Event): void {
    event.stopPropagation();
    this.showPremiumMessage = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedCard = null;
  }

  flipDetail(): void {
    this.detailSide = this.detailSide === 'face' ? 'back' : 'face';
  }

  getCollectedCount(): number {
    return this.collectionCards.filter(item => item.owned).length;
  }

  purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
    this.showPremiumMessage = false;
    // Grant premium prediction and question attempts
    this.attemptService.refreshPredictionAttempts();
    this.attemptService.refreshQuestionAttempts();
    // Immediately refresh collection to show all cards as available (not locked)
    this.loadCollection();
  }
}
