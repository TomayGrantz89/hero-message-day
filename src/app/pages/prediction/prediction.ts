import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardData, Card, PredictionItem } from '../../services/card-data';
import { Attempt } from '../../services/attempt';

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

  constructor(
    private cardData: CardData,
    public attemptService: Attempt
  ) {}

  ngOnInit(): void {
    this.updateAttempts();
    this.startTimer();
    this.initializeCardState();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
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
        // Show card face up (not prediction) as per requirements
        this.showCardFace = true;
        this.showPrediction = false;
      } else {
        // Fallback: load random card but still show face up
        this.loadRandomCard();
        this.showCardFace = true;
        this.showPrediction = false;
      }
    } else {
      // No prediction received today, show card back
      this.loadRandomCard();
      this.showCardFace = false;
      this.showPrediction = false;
    }
  }

  private loadRandomCard(): void {
    // In a real app, you would fetch a random card from the service
    // For demo, we'll pick the first card
    this.card = this.cardData.getAllCards()[0];
    this.prediction = this.cardData.getRandomPrediction();
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
          } else {
            return; // No attempt available
          }
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
      this.flipToFace();
    }
  }

  watchAd(): void {
    this.attemptService.watchAd();
    this.showAdModal = false;
    this.updateAttempts();
    // Instead of flipping to face immediately, show "Get new card" button
    this.showNewCardButton = true;
    this.isNewCardAfterAd = true;
    // Hide the card face/prediction
    this.showCardFace = false;
    this.showPrediction = false;
  }

  getNewCardAfterAd(): void {
    // Load a new random card
    this.loadRandomCard();
    // Reset flags
    this.showNewCardButton = false;
    this.isNewCardAfterAd = false;
    // Card shows back side (face down)
    this.showCardFace = false;
    this.showPrediction = false;
    // User can now flip this card (they have the ad attempt)
  }

  closeAdModal(): void {
    this.showAdModal = false;
  }
}
