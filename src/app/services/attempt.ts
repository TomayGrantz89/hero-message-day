import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Attempt {
  private readonly STORAGE_KEY = 'cardGameAttempts';
  private readonly AD_WATCHED_KEY = 'cardGameAdWatched';
  private readonly LAST_RESET_KEY = 'cardGameLastReset';
  private readonly PREDICTION_RECEIVED_KEY = 'cardGamePredictionReceived';
  private readonly LAST_CARD_DATA_KEY = 'cardGameLastCardData';

  constructor() {
    this.resetIfNeeded();
  }

  private resetIfNeeded(): void {
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem(this.LAST_RESET_KEY);

    if (lastReset !== today) {
      localStorage.setItem(this.STORAGE_KEY, '1'); // reset free attempts to 1
      localStorage.setItem(this.AD_WATCHED_KEY, 'false');
      localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
      localStorage.setItem(this.LAST_RESET_KEY, today);
    }
  }

  getRemainingAttempts(): number {
    const attempts = parseInt(localStorage.getItem(this.STORAGE_KEY) || '1');
    return attempts;
  }

  useAttempt(): boolean {
    const attempts = this.getRemainingAttempts();
    if (attempts <= 0) return false;
    localStorage.setItem(this.STORAGE_KEY, (attempts - 1).toString());
    return true;
  }

  canWatchAd(): boolean {
    return localStorage.getItem(this.AD_WATCHED_KEY) !== 'true';
  }

  watchAd(): void {
    localStorage.setItem(this.AD_WATCHED_KEY, 'true');
    // Grant one extra attempt
    const current = this.getRemainingAttempts();
    localStorage.setItem(this.STORAGE_KEY, (current + 1).toString());
  }

  getTimeUntilNextReset(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Prediction tracking
  markPredictionReceived(cardData: any, predictionText: string): void {
    localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'true');
    const lastCardData = {
      card: cardData,
      prediction: predictionText,
      predictionId: Date.now(), // simple ID
      cardId: cardData?.id || 1,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.LAST_CARD_DATA_KEY, JSON.stringify(lastCardData));
  }

  wasPredictionReceivedToday(): boolean {
    return localStorage.getItem(this.PREDICTION_RECEIVED_KEY) === 'true';
  }

  getLastCardData(): any {
    const data = localStorage.getItem(this.LAST_CARD_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Reset for new card after ad (keeps prediction received flag but resets card display)
  resetForNewCard(): void {
    // Keep prediction received flag as true (since prediction was already received today)
    // But we need to allow flipping a new card
    // We'll track separately that a new card is available after ad
    localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
  }

  // Check if user has free attempt remaining (not ad attempt)
  hasFreeAttempt(): boolean {
    return this.getRemainingAttempts() > 0;
  }

  // Check if user has used ad attempt today
  hasUsedAdAttempt(): boolean {
    return localStorage.getItem(this.AD_WATCHED_KEY) === 'true';
  }
}
