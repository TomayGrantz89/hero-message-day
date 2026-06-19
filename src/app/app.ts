import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Premium } from './services/premium';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('cardnew');
  isPremium = false;

  constructor(private premium: Premium) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
  }

  purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
  }
}
