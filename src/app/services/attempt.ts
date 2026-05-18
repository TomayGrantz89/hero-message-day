import { Injectable } from '@angular/core';
import { Premium } from './premium';

@Injectable({
  providedIn: 'root',
})
export class Attempt {
  private readonly STORAGE_KEY = 'cardGameAttempts';
  private readonly AD_WATCHED_KEY = 'cardGameAdWatched';
  private readonly LAST_RESET_KEY = 'cardGameLastReset';
  private readonly PREDICTION_RECEIVED_KEY = 'cardGamePredictionReceived';
  private readonly LAST_CARD_DATA_KEY = 'cardGameLastCardData';
  private readonly COLLECTION_KEY = 'cardGameCollection';
  private readonly TODAY_PREDICTION_IDS_KEY = 'cardGameTodayPredictionIds';
  private readonly QUESTION_ATTEMPTS_KEY = 'cardGameQuestionAttempts';
  private readonly QUESTION_LAST_RESET_KEY = 'cardGameQuestionLastReset';

  constructor(private premium: Premium) {
    this.resetIfNeeded();
    this.initializeCollection();
  }

  private resetIfNeeded(): void {
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem(this.LAST_RESET_KEY);

    if (lastReset !== today) {
      // Set attempts based on premium status
      const initialAttempts = this.premium.isPremium() ? 2 : 1;
      localStorage.setItem(this.STORAGE_KEY, initialAttempts.toString());

      // Reset ad watched flag only for non-premium users
      // Premium users don't have ads
      if (!this.premium.isPremium()) {
        localStorage.setItem(this.AD_WATCHED_KEY, 'false');
      } else {
        // For premium users, mark ad as already watched (no ads available)
        localStorage.setItem(this.AD_WATCHED_KEY, 'true');
      }

      localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
      localStorage.setItem(this.TODAY_PREDICTION_IDS_KEY, JSON.stringify([]));
      localStorage.setItem(this.LAST_RESET_KEY, today);

      // Reset question attempts
      const initialQuestionAttempts = this.premium.isPremium() ? 3 : 1;
      localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, initialQuestionAttempts.toString());
      localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
    }
  }

  private initializeCollection(): void {
    // Ensure collection exists in localStorage
    if (!localStorage.getItem(this.COLLECTION_KEY)) {
      localStorage.setItem(this.COLLECTION_KEY, JSON.stringify([]));
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

  // Question attempts management
  getRemainingQuestionAttempts(): number {
    // Ensure daily reset
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem(this.QUESTION_LAST_RESET_KEY);
    if (lastReset !== today) {
      const initialQuestionAttempts = this.premium.isPremium() ? 3 : 1;
      localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, initialQuestionAttempts.toString());
      localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
    }
    const attempts = parseInt(localStorage.getItem(this.QUESTION_ATTEMPTS_KEY) || '1');
    return attempts;
  }

  useQuestionAttempt(): boolean {
    const attempts = this.getRemainingQuestionAttempts();
    if (attempts <= 0) return false;
    localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, (attempts - 1).toString());
    return true;
  }

  canWatchAd(): boolean {
    // Premium users don't have ads
    if (this.premium.isPremium()) {
      return false;
    }
    return localStorage.getItem(this.AD_WATCHED_KEY) !== 'true';
  }

  watchAd(): void {
    // Premium users cannot watch ads
    if (this.premium.isPremium()) {
      return;
    }

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
  markPredictionReceived(cardData: any, predictionText: string, predictionId?: number): void {
    localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'true');

    // Add prediction ID to today's prediction IDs
    const todayPredictionIds = this.getTodayPredictionIds();
    if (predictionId !== undefined && !todayPredictionIds.includes(predictionId)) {
      todayPredictionIds.push(predictionId);
      localStorage.setItem(this.TODAY_PREDICTION_IDS_KEY, JSON.stringify(todayPredictionIds));
    }

    const lastCardData = {
      card: cardData,
      prediction: predictionText,
      predictionId: predictionId || Date.now(), // use actual ID if provided, otherwise timestamp
      cardId: cardData?.id || 1,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.LAST_CARD_DATA_KEY, JSON.stringify(lastCardData));
  }

  getTodayPredictionIds(): number[] {
    const data = localStorage.getItem(this.TODAY_PREDICTION_IDS_KEY);
    return data ? JSON.parse(data) : [];
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

  // Collection management
  addCardToCollection(cardId: number): void {
    const collection = this.getCollection();
    if (!collection.includes(cardId)) {
      collection.push(cardId);
      localStorage.setItem(this.COLLECTION_KEY, JSON.stringify(collection));
    }
  }

  getCollection(): number[] {
    const data = localStorage.getItem(this.COLLECTION_KEY);
    return data ? JSON.parse(data) : [];
  }

  getCollectionPercentage(totalCards: number): number {
    const collection = this.getCollection();
    if (totalCards === 0) return 0;
    return (collection.length / totalCards) * 100;
  }

  hasCard(cardId: number): boolean {
    const collection = this.getCollection();
    return collection.includes(cardId);
  }

  getCollectionSize(): number {
    return this.getCollection().length;
  }
}
