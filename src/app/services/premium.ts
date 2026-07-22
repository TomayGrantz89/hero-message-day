import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';

  private premiumStatusSource = new BehaviorSubject<boolean>(this.isPremium());
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

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
    // Premium users have unlimited questions — no need to set a fixed count
    this.premiumStatusSource.next(true);
  }

  /**
   * Deactivate premium access (for testing or refund scenarios)
   */
  deactivatePremium(): void {
    localStorage.removeItem(this.PREMIUM_KEY);
    localStorage.removeItem(this.PREMIUM_PURCHASE_DATE_KEY);
    this.premiumStatusSource.next(false);
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
