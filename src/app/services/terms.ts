import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TermsService {
  private readonly TERMS_KEY = 'cardGameTermsAccepted';

  /**
   * Check if the user has accepted the terms
   */
  isTermsAccepted(): boolean {
    return localStorage.getItem(this.TERMS_KEY) === 'true';
  }

  /**
   * Save terms acceptance to localStorage
   */
  acceptTerms(): void {
    localStorage.setItem(this.TERMS_KEY, 'true');
  }
}
