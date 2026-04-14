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

  constructor(
    private cardData: CardData,
    public attemptService: Attempt
  ) {}

  ngOnInit(): void {
    this.updateAttempts();
    this.startTimer();
    this.loadRandomCard();
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
    }
  }

  flipCard(): void {
    if (!this.showCardFace) {
      this.flipToFace();
    } else if (!this.showPrediction) {
      this.flipToPrediction();
    } else {
      // toggle back to face
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
    this.flipToFace();
  }

  closeAdModal(): void {
    this.showAdModal = false;
  }
}
