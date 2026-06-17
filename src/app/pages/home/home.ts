import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Premium } from '../../services/premium';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  isPremium = false;

  constructor(private premium: Premium) {}

  ngOnInit(): void {
    this.isPremium = this.premium.isPremium();
  }

  purchasePremium(): void {
    // Simulate purchase
    this.premium.activatePremium();
    this.isPremium = true;
    // alert('Премиум-доступ активирован! Теперь вам доступны все карты и 2 попытки в день без рекламы.');
  }
}
