import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Premium } from '../../services/premium';
import { Attempt } from '../../services/attempt';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './top-bar.html',
  styleUrls: ['./top-bar.scss'],
})
export class TopBarComponent {
  /** Whether to show the home icon (hidden on the home page itself) */
  @Input() showHomeIcon: boolean = true;

  /** Emitted when premium is purchased, so parent pages can refresh their UI */
  @Output() premiumPurchased = new EventEmitter<void>();

  constructor(
    private premium: Premium,
    private attempt: Attempt
  ) {}

  get isPremium(): boolean {
    return this.premium.isPremium();
  }

  purchasePremium(): void {
    this.premium.activatePremium();
    // Immediately grant 2 prediction attempts for premium user
    this.attempt.refreshPredictionAttempts();
    // Refresh oracle question attempts to premium maximum (5)
    this.attempt.refreshQuestionAttempts();
    // Notify parent page to update its UI
    this.premiumPurchased.emit();
  }
}
