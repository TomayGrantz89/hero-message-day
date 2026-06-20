import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardData, Card, PredictionItem } from '../../services/card-data';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';

@Component({
  selector: 'app-prediction',
  imports: [CommonModule, RouterLink],
  templateUrl: './prediction.html',
  styleUrl: './prediction.scss',
})
export class Prediction implements OnInit, OnDestroy {
  card: Card | null = null;
  prediction: PredictionItem | null = null;
  showCardFace = false;
  showPrediction = false;
  attemptsRemaining = 0;
  timer = '00:00:00';
  private timerInterval: any;
  showAdModal = false;
  showNewCardButton = false; // Button "Получить новую карту" after ad
  isNewCardAfterAd = false; // Flag that we're showing a new card after ad
  private previousPredictionId: number | null = null; // Track previous prediction ID to ensure different predictions

  // Enlarged card overlay
  showEnlarged = false;
  enlargedSide: 'face' | 'back' = 'face';

  // Premium status
  isPremium = false;
  maxAttemptsPerDay = 1;

  constructor(
    private cardData: CardData,
    public attemptService: Attempt,
    private premium: Premium
  ) {}

  ngOnInit(): void {
    this.updatePremiumStatus();
    this.updateAttempts();
    this.startTimer();
    this.initializeCardState();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private updatePremiumStatus(): void {
    this.isPremium = this.premium.isPremium();
    this.maxAttemptsPerDay = this.isPremium ? 2 : 1;
  }

  private updateAttempts(): void {
    this.attemptsRemaining = this.attemptService.getRemainingAttempts();
  }

  private startTimer(): void {
    this.updateTimer();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  private updateTimer(): void {
    this.timer = this.attemptService.getTimeUntilNextReset();
  }

  private initializeCardState(): void {
    // Check if prediction was already received today
    if (this.attemptService.wasPredictionReceivedToday()) {
      // Load last card data if available
      const lastData = this.attemptService.getLastCardData();
      if (lastData) {
        this.card = lastData.card;
        // Create a PredictionItem with minimal data (text is the main thing needed)
        this.prediction = {
          id: lastData.predictionId || 1,
          text: lastData.prediction,
          cardId: lastData.card?.id || 1
        };
        // Store the prediction ID for future different predictions
        this.previousPredictionId = this.prediction.id;
        // Show card face up (not prediction) as per requirements
        this.showCardFace = true;
        this.showPrediction = false;
      } else {
        // Fallback: load random card but still show face up
        this.loadRandomCard(false);
        this.showCardFace = true;
        this.showPrediction = false;
      }
    } else {
      // No prediction received today, show card back
      this.loadRandomCard(false);
      this.showCardFace = false;
      this.showPrediction = false;
    }
  }

  private loadRandomCard(addToCollection: boolean = false, useDifferentPrediction: boolean = false): void {
    // Get user's collection to determine which cards they already have
    const userCardIds = this.attemptService.getCollection();
    // Get a new card with probability adjusted based on collection completion
    this.card = this.cardData.getNewCard(userCardIds);

    // Get prediction, ensuring it's different from previous if requested
    if (useDifferentPrediction && this.previousPredictionId !== null) {
      this.prediction = this.cardData.getDifferentPrediction(this.previousPredictionId);
    } else {
      this.prediction = this.cardData.getRandomPrediction();
    }

    // Store the prediction ID for future use
    if (this.prediction) {
      this.previousPredictionId = this.prediction.id;
    }

    // Add this card to collection if not already there
    if (addToCollection && this.card && !this.attemptService.hasCard(this.card.id)) {
      this.attemptService.addCardToCollection(this.card.id);
    }
  }

  flipToFace(): void {
    if (!this.showCardFace) {
      this.showCardFace = true;
      this.showPrediction = false;
    }
  }

  flipToPrediction(): void {
    if (this.showCardFace && !this.showPrediction) {
      this.showPrediction = true;
      // Mark prediction as received when user sees it
      if (this.card && this.prediction) {
        this.attemptService.markPredictionReceived(this.card, this.prediction.text);
      }
    }
  }

  flipCard(): void {
    // If card is showing back side and we need to flip to face
    if (!this.showCardFace && !this.showPrediction) {
      // Check if user can flip (has attempt or is in new card after ad state)
      if (this.attemptsRemaining > 0 || this.isNewCardAfterAd) {
        // Use attempt if not in new card after ad state
        if (!this.isNewCardAfterAd) {
          const used = this.attemptService.useAttempt();
          if (used) {
            this.updateAttempts();
            // Add card to collection when attempt is used
            this.addCurrentCardToCollection();
          } else {
            return; // No attempt available
          }
        } else {
          // For new card after ad or drawNewCard, also add to collection (already done in loadRandomCard(true))
          this.addCurrentCardToCollection();
          // Reset flag so subsequent clicks work normally
          this.isNewCardAfterAd = false;
        }
        this.flipToFace();
      } else if (this.attemptService.canWatchAd()) {
        // No attempts but can watch ad - show ad modal
        this.showAdModal = true;
      }
      // Otherwise do nothing (no attempts, ad already watched)
    } else if (this.showCardFace && !this.showPrediction) {
      // Flip from face to prediction
      this.flipToPrediction();
    } else if (this.showPrediction) {
      // Flip back to face from prediction
      this.showPrediction = false;
    }
  }

  private addCurrentCardToCollection(): void {
    if (this.card && !this.attemptService.hasCard(this.card.id)) {
      this.attemptService.addCardToCollection(this.card.id);
    }
  }

  openCard(): void {
    if (this.attemptsRemaining <= 0) {
      // Show ad modal if possible
      if (this.attemptService.canWatchAd()) {
        this.showAdModal = true;
        return;
      }
      return;
    }

    const used = this.attemptService.useAttempt();
    if (used) {
      this.updateAttempts();
      this.addCurrentCardToCollection();
      this.flipToFace();
    }
  }

  watchAd(): void {
    this.attemptService.watchAd();
    this.showAdModal = false;
    this.updateAttempts();
    // Show "Get new card" button, but keep current card visible
    this.showNewCardButton = true;
    this.isNewCardAfterAd = true;
    // Do NOT hide the card face/prediction - keep last opened card visible
    // showCardFace and showPrediction remain unchanged
  }

  getNewCardAfterAd(): void {
    // Load a new random card and add to collection, ensuring different prediction
    this.loadRandomCard(true, true);
    // Reset flags
    this.showNewCardButton = false;
    this.isNewCardAfterAd = false;
    // Card shows back side (face down)
    this.showCardFace = false;
    this.showPrediction = false;
    // User can now flip this card (they have the ad attempt)
  }

  drawNewCard(): void {
    // Premium user with remaining attempts wants to draw a new card
    // Use one attempt (already consumed here)
    const used = this.attemptService.useAttempt();
    if (used) {
      this.updateAttempts();
      // Load a new random card and add to collection
      this.loadRandomCard(true, true);
      // Reset card display to show back side
      this.showCardFace = false;
      this.showPrediction = false;
      // Mark as "new card after attempt" so flipCard() doesn't consume another attempt
      this.isNewCardAfterAd = true;
    }
  }

  purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
    this.maxAttemptsPerDay = 2;
    this.updateAttempts();
  //   alert('Премиум-доступ активирован! Теперь вам доступны все карты и 2 попытки в день без рекламы.');
  }

  closeAdModal(): void {
    this.showAdModal = false;
  }

  // Enlarged card overlay methods
  openEnlarged(event: MouseEvent): void {
    event.stopPropagation();
    if (this.card) {
      this.showEnlarged = true;
      this.enlargedSide = 'face';
    }
  }

  closeEnlarged(): void {
    this.showEnlarged = false;
    this.enlargedSide = 'face';
  }

  flipEnlarged(): void {
    this.enlargedSide = this.enlargedSide === 'face' ? 'back' : 'face';
  }
}
