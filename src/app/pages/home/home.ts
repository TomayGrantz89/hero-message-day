import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Premium } from '../../services/premium';
import { Attempt } from '../../services/attempt';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from '../../components/top-bar/top-bar';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, TopBarComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  isPremium = false;

  constructor(
    private premium: Premium,
    private attempt: Attempt
  ) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
  }

  onPremiumPurchased(): void {
    this.isPremium = true;
    // Refresh attempts is already handled by top-bar component
  }

  purchasePremium(): void {
    // Simulate purchase
    this.premium.activatePremium();
    this.isPremium = true;
    // Immediately grant 2 prediction attempts for premium user
    this.attempt.refreshPredictionAttempts();
    // Refresh oracle question attempts to premium maximum (5)
    this.attempt.refreshQuestionAttempts();
    // alert('Премиум-доступ активирован! Теперь вам доступны все карты и 2 попытки в день без рекламы.');
  }
}
