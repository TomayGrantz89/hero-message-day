import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardData, Card } from '../../services/card-data';
import { Attempt } from '../../services/attempt';

@Component({
  selector: 'app-collection',
  imports: [CommonModule, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection implements OnInit {
  cards: Card[] = [];
  selectedCard: Card | null = null;
  showDetail = false;
  detailSide: 'face' | 'back' = 'face';

  constructor(
    private cardData: CardData,
    private attemptService: Attempt
  ) {}

  ngOnInit(): void {
    // Load only cards from user's collection
    this.loadCollection();
  }

  private loadCollection(): void {
    const collectedIds = this.attemptService.getCollection();
    this.cards = collectedIds
      .map(id => this.cardData.getCard(id))
      .filter((card): card is Card => card !== undefined);
  }

  selectCard(card: Card): void {
    this.selectedCard = card;
    this.showDetail = true;
    this.detailSide = 'face';
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedCard = null;
  }

  flipDetail(): void {
    this.detailSide = this.detailSide === 'face' ? 'back' : 'face';
  }

  getRarityBorder(card: Card): string {
    switch (card.rarity) {
      case 'common': return '2px solid #aaa';
      case 'rare': return '2px solid #1e90ff';
      case 'epic': return '2px solid #9b30ff';
      case 'legendary': return '2px solid #ffd700';
      default: return '2px solid #aaa';
    }
  }

  getRarityGlow(card: Card): string {
    switch (card.rarity) {
      case 'common': return '0 0 5px #aaa';
      case 'rare': return '0 0 10px #1e90ff';
      case 'epic': return '0 0 15px #9b30ff';
      case 'legendary': return '0 0 20px #ffd700';
      default: return 'none';
    }
  }
}
