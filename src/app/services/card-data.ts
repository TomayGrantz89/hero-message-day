import { Injectable } from '@angular/core';
import { Premium } from './premium';
import { CHARACTER_CARDS, PREDICTIONS } from '../models/character-card';

export interface Card {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  /** История карты (отображается в коллекции) */
  story: string;
}

export interface PredictionItem {
  id: number;
  text: string;
  cardId: number;
}

@Injectable({
  providedIn: 'root',
})
export class CardData {
  private cards: Card[] = [];
  private predictions: PredictionItem[] = [];

  constructor(private premium: Premium) {
    this.generateMockData();
  }

  private generateMockData(): void {
    // Use real character card data from CHARACTER_CARDS (59 cards with names, images, stories)
    // We create up to 59 cards for the game, using the first 59 character cards directly
    const maxCards = Math.min(CHARACTER_CARDS.length, 59);

    for (let i = 0; i < maxCards; i++) {
      const character = CHARACTER_CARDS[i];
      this.cards.push({
        id: i + 1,
        name: character.name,
        imageUrl: character.image,
        description: character.story,
        story: character.story,
      });
    }

    // Generate predictions from the PREDICTIONS array (not tied to cards)
    for (let i = 0; i < PREDICTIONS.length; i++) {
      this.predictions.push({
        id: i + 1,
        text: PREDICTIONS[i],
        cardId: 0, // Not tied to any card
      });
    }
  }

  getAllCards(): Card[] {
    if (this.premium.isPremium()) {
      return this.cards; // All 59 cards for premium users
    } else {
      // Only first 14 cards for non-premium users
      return this.cards.slice(0, 14);
    }
  }

  getCard(id: number): Card | undefined {
    const card = this.cards.find(c => c.id === id);
    if (!card) return undefined;

    // Check if card is accessible for non-premium users
    if (!this.premium.isPremium() && id > 14) {
      return undefined; // Card not accessible
    }

    return card;
  }

  getRandomPrediction(): PredictionItem {
    const idx = Math.floor(Math.random() * this.predictions.length);
    return this.predictions[idx];
  }

  getDifferentPrediction(excludeId: number): PredictionItem {
    // Filter out the prediction with the given ID
    const availablePredictions = this.predictions.filter(p => p.id !== excludeId);
    if (availablePredictions.length === 0) {
      // Fallback to any prediction if no others available
      return this.getRandomPrediction();
    }
    const idx = Math.floor(Math.random() * availablePredictions.length);
    return availablePredictions[idx];
  }

  getPredictionExcludingIds(excludeIds: number[]): PredictionItem {
    // Filter out predictions with any of the given IDs
    const availablePredictions = this.predictions.filter(p => !excludeIds.includes(p.id));
    if (availablePredictions.length === 0) {
      // Fallback to any prediction if no others available
      return this.getRandomPrediction();
    }
    const idx = Math.floor(Math.random() * availablePredictions.length);
    return availablePredictions[idx];
  }

  getPredictionsForCard(cardId: number): PredictionItem[] {
    return this.predictions.filter(p => p.cardId === cardId);
  }

  // Get a new card that the user doesn't already have in their collection
  getNewCard(userCardIds: number[]): Card {
    // Filter accessible cards based on premium status
    const accessibleCards = this.premium.isPremium() ? this.cards : this.cards.slice(0, 14);

    // Filter new cards from accessible cards
    const newCards = accessibleCards.filter(c => !userCardIds.includes(c.id));

    if (newCards.length > 0) {
      // Always return a new card if one is available
      return newCards[Math.floor(Math.random() * newCards.length)];
    }

    // If all accessible cards are already collected, return a random one (duplicate)
    return accessibleCards[Math.floor(Math.random() * accessibleCards.length)];
  }
}
