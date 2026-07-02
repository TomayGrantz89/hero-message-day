import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardData, Card } from '../../services/card-data';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';

interface CollectionCard {
  card: Card;
  owned: boolean;
}

@Component({
  selector: 'app-collection',
  imports: [CommonModule],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection implements OnInit {
  collectionCards: CollectionCard[] = [];
  selectedCard: Card | null = null;
  showDetail = false;
  detailSide: 'face' | 'back' = 'face';

  // Premium status
  isPremium = false;
  totalCards = 0;

  // Swipe/carousel properties
  currentSwipePage = 0;
  cardsPerSwipe = 6; // Default for mobile portrait (3 columns × 2 rows)
  swipePages: CollectionCard[][] = [];

  // Touch tracking
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly SWIPE_THRESHOLD = 50;

  constructor(
    private cardData: CardData,
    private attemptService: Attempt,
    private premium: Premium
  ) {}

  ngOnInit(): void {
    this.calculateCardsPerSwipe();
    this.loadCollection();
    this.updatePremiumStatus();
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
        this.cardsPerSwipe = 6; // 3 columns × 2 rows
      }
    } else {
      // Desktop — not used for swipe, but set a default
      this.cardsPerSwipe = 14;
    }
  }

  private loadCollection(): void {
    const collectedIds = this.attemptService.getCollection();
    const allCards = this.cardData.getAllCards();

    this.collectionCards = allCards.map(card => ({
      card,
      owned: collectedIds.includes(card.id)
    }));

    this.buildSwipePages();
  }

  private buildSwipePages(): void {
    this.swipePages = [];
    for (let i = 0; i < this.collectionCards.length; i += this.cardsPerSwipe) {
      this.swipePages.push(this.collectionCards.slice(i, i + this.cardsPerSwipe));
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

    // For non-premium users, accessible cards are limited to 14
    // For premium users, total cards is 64 (as defined in card-data.ts)
    this.totalCards = this.isPremium ? 64 : 14;
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

  selectCard(item: CollectionCard): void {
    if (!item.owned) {
      return; // Do nothing for locked cards
    }
    this.selectedCard = item.card;
    this.showDetail = true;
    this.detailSide = 'face';
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
    this.totalCards = 64;
    // Grant premium prediction and question attempts
    this.attemptService.refreshPredictionAttempts();
    this.attemptService.refreshQuestionAttempts();
  }
}
