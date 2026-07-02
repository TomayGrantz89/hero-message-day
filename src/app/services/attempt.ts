import { Injectable } from '@angular/core';
import { Premium } from './premium';

@Injectable({
  providedIn: 'root',
})
export class Attempt {
  private readonly STORAGE_KEY = 'cardGameAttempts';
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

      localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
      localStorage.setItem(this.TODAY_PREDICTION_IDS_KEY, JSON.stringify([]));
      localStorage.setItem(this.LAST_RESET_KEY, today);

      // Clear last card data when a new day starts (timer resets attempts)
      this.clearLastCardData();

      // Reset question attempts
      const initialQuestionAttempts = this.premium.isPremium() ? 5 : 1;
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
    // Cap attempts based on current premium status to prevent stale values
    // (e.g., if user was premium and then lost access)
    const maxAttempts = this.premium.isPremium() ? 2 : 1;
    return Math.min(attempts, maxAttempts);
  }

  useAttempt(): boolean {
    const attempts = this.getRemainingAttempts();
    if (attempts <= 0) return false;
    localStorage.setItem(this.STORAGE_KEY, (attempts - 1).toString());
    return true;
  }

  /**
   * Set attempts to a specific count (capped by premium max)
   */
  setAttempts(count: number): void {
    const maxAttempts = this.premium.isPremium() ? 2 : 1;
    const cappedCount = Math.min(count, maxAttempts);
    localStorage.setItem(this.STORAGE_KEY, cappedCount.toString());
  }

  // Question attempts management
  getRemainingQuestionAttempts(): number {
    // Ensure daily reset
    const now = new Date();
    const today = now.toDateString();
    const lastReset = localStorage.getItem(this.QUESTION_LAST_RESET_KEY);
    if (lastReset !== today) {
      const initialQuestionAttempts = this.premium.isPremium() ? 5 : 1;
      localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, initialQuestionAttempts.toString());
      localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
    }
    const attempts = parseInt(localStorage.getItem(this.QUESTION_ATTEMPTS_KEY) || '1');
    // Cap attempts based on current premium status to prevent stale values
    // (e.g., if user was premium and then lost access)
    const maxAttempts = this.premium.isPremium() ? 5 : 1;
    return Math.min(attempts, maxAttempts);
  }

  useQuestionAttempt(): boolean {
    const attempts = this.getRemainingQuestionAttempts();
    if (attempts <= 0) return false;
    localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, (attempts - 1).toString());
    return true;
  }

  /**
   * Refresh prediction attempts to premium maximum (2)
   * Called when user purchases premium to immediately grant full attempts
   */
  refreshPredictionAttempts(): void {
    localStorage.setItem(this.STORAGE_KEY, '2');
    const today = new Date().toDateString();
    localStorage.setItem(this.LAST_RESET_KEY, today);
    // Reset prediction received flag so user can draw new cards
    localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
  }

  /**
   * Refresh question attempts to premium maximum (5)
   * Called when user purchases premium to immediately grant full attempts
   */
  refreshQuestionAttempts(): void {
    localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, '5');
    const today = new Date().toDateString();
    localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
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

  /**
   * Clear last card data when a new day starts
   */
  clearLastCardData(): void {
    localStorage.removeItem(this.LAST_CARD_DATA_KEY);
  }

  // Reset prediction received flag (used when premium user draws a second card)
  resetPredictionReceived(): void {
    localStorage.setItem(this.PREDICTION_RECEIVED_KEY, 'false');
  }

  // Check if user has free attempt remaining
  hasFreeAttempt(): boolean {
    return this.getRemainingAttempts() > 0;
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

  /**
   * Check if there is a last card data saved (card was opened today)
   */
  get haslastCard(): boolean {
    return this.getLastCardData() !== null;
  }
}
