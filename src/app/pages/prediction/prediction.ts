import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardData, Card, PredictionItem } from '../../services/card-data';
import { Attempt } from '../../services/attempt';
import { Premium } from '../../services/premium';

@Component({
  selector: 'app-prediction',
  imports: [CommonModule],
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
  private previousPredictionId: number | null = null;

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
    // Check if there's saved card data (card was opened earlier today)
    const lastData = this.attemptService.getLastCardData();
    if (lastData) {
      // Card was already opened today — show it face up (image side)
      this.card = lastData.card;
      this.prediction = {
        id: lastData.predictionId || 1,
        text: lastData.prediction,
        cardId: lastData.card?.id || 1
      };
      this.previousPredictionId = this.prediction.id;
      this.showCardFace = true;
      this.showPrediction = false;
    } else {
      // No card opened today — show card back
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

  flipCard(): void {
    // If card is showing back side — flip to face
    if (!this.showCardFace) {
      // Check if user can flip (has attempt)
      if (this.attemptsRemaining > 0) {
        const used = this.attemptService.useAttempt();
        if (used) {
          this.updateAttempts();
          // Add card to collection when attempt is used
          this.addCurrentCardToCollection();
          this.showCardFace = true;
          this.showPrediction = false;
          // Save card data immediately when user flips
          if (this.card && this.prediction) {
            this.attemptService.markPredictionReceived(this.card, this.prediction.text, this.prediction.id);
          }
        }
      }
      // Otherwise do nothing (no attempts)
    } else {
      // Card is already flipped — toggle between image and prediction
      this.showPrediction = !this.showPrediction;
    }
  }

  private addCurrentCardToCollection(): void {
    if (this.card && !this.attemptService.hasCard(this.card.id)) {
      this.attemptService.addCardToCollection(this.card.id);
    }
  }

  /**
   * Determines if the action button should be shown
   */
  get showButton(): boolean {
    // Show button only when card is not yet opened (back side up)
    return !this.showCardFace;
  }

  /**
   * Returns the button text based on current state
   */
  get buttonText(): string {
    if (!this.showCardFace) {
      // Free user with no attempts — offer premium purchase
      if (!this.isPremium && this.attemptsRemaining <= 0) {
        return 'Купить премиум';
      }
      return 'Открыть карту';
    }
    return '';
  }

  /**
   * Handles the action button click
   */
  onActionButtonClick(): void {
    if (!this.showCardFace) {
      // Free user with no attempts — offer premium purchase
      if (!this.isPremium && this.attemptsRemaining <= 0) {
        this.purchasePremium();
        return;
      }
      // Card not opened — flip it (uses an attempt)
      this.flipCard();
    }
  }

  drawNewCard(): void {
    // User wants to draw a new card
    // Check if user has remaining attempts
    if (this.attemptsRemaining > 0) {
      // Use one attempt
      const used = this.attemptService.useAttempt();
      if (used) {
        this.updateAttempts();
        // Reset prediction received flag so the new card can be tracked
        this.attemptService.resetPredictionReceived();
        // Load a new random card and add to collection
        this.loadRandomCard(true, true);
        // Reset card display to show back side
        this.showCardFace = false;
        this.showPrediction = false;
      }
    }
    // Otherwise do nothing (no attempts)
  }

  purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
    this.maxAttemptsPerDay = 2;
    // Immediately grant 2 prediction attempts for premium user
    this.attemptService.refreshPredictionAttempts();
    this.updateAttempts();
    // Refresh oracle question attempts to premium maximum (5)
    this.attemptService.refreshQuestionAttempts();
    // Reset card state so user can immediately draw a new card
    this.loadRandomCard(false);
    this.showCardFace = false;
    this.showPrediction = false;
  }
}
