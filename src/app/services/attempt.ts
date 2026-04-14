import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Attempt {
  private readonly STORAGE_KEY = 'cardGameAttempts';
  private readonly AD_WATCHED_KEY = 'cardGameAdWatched';
  private readonly LAST_RESET_KEY = 'cardGameLastReset';

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
}
