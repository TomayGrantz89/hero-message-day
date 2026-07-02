import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Premium } from '../../services/premium';
import { Attempt } from '../../services/attempt';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
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

  purchasePremium(): void {
    // Simulate purchase
    this.premium.activatePremium();
    this.isPremium = true;
    // Immediately grant 2 prediction attempts for premium user
    this.attempt.refreshPredictionAttempts();
    // Refresh oracle question attempts to premium maximum (5)
    this.attempt.refreshQuestionAttempts();
  }
}
