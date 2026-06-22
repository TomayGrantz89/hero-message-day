import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';
  private readonly QUESTION_ATTEMPTS_KEY = 'cardGameQuestionAttempts';
  private readonly QUESTION_LAST_RESET_KEY = 'cardGameQuestionLastReset';

  constructor() {}

  /**
   * Check if user has premium access
   */
  isPremium(): boolean {
    return localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  /**
   * Activate premium access (simulate purchase)
   */
  activatePremium(): void {
    localStorage.setItem(this.PREMIUM_KEY, 'true');
    localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, new Date().toISOString());
    // Immediately grant 5 question attempts for the oracle section
    localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, '5');
    const today = new Date().toDateString();
    localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
  }

  /**
   * Deactivate premium access (for testing or refund scenarios)
   */
  deactivatePremium(): void {
    localStorage.removeItem(this.PREMIUM_KEY);
    localStorage.removeItem(this.PREMIUM_PURCHASE_DATE_KEY);
  }

  /**
   * Get purchase date if available
   */
  getPurchaseDate(): Date | null {
    const dateStr = localStorage.getItem(this.PREMIUM_PURCHASE_DATE_KEY);
    return dateStr ? new Date(dateStr) : null;
  }

  /**
   * Get days since purchase
   */
  getDaysSincePurchase(): number | null {
    const purchaseDate = this.getPurchaseDate();
    if (!purchaseDate) return null;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get premium status for display
   */
  getStatus(): { isPremium: boolean; purchaseDate: Date | null; daysSince: number | null } {
    return {
      isPremium: this.isPremium(),
      purchaseDate: this.getPurchaseDate(),
      daysSince: this.getDaysSincePurchase()
    };
  }
}
