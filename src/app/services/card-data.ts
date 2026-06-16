import { Injectable } from '@angular/core';
import { Premium } from './premium';
import { CHARACTER_CARDS } from '../models/character-card';

export interface Card {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  history: string;
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
    // Use real character card images from CHARACTER_CARDS
    const realImages = CHARACTER_CARDS.map(c => c.image);

    // Generate 50 cards (40 + 10 more for premium)
    for (let i = 1; i <= 50; i++) {
      // Cycle through real images, wrapping around if needed
      const imageIndex = (i - 1) % realImages.length;
      this.cards.push({
        id: i,
        name: `Card ${i}`,
        imageUrl: realImages[imageIndex],
        description: `Description for card ${i}`,
        history: `Historical background for card ${i}. This card has a rich history dating back centuries.`,
      });
    }

    // Generate 80 predictions, each linked to a random card
    for (let i = 1; i <= 80; i++) {
      this.predictions.push({
        id: i,
        text: `Prediction ${i}: Today you will encounter something unexpected.`,
        cardId: Math.floor(Math.random() * 50) + 1,
      });
    }
  }

  getAllCards(): Card[] {
    if (this.premium.isPremium()) {
      return this.cards; // All 50 cards for premium users
    } else {
      // Only first 15 cards for non-premium users
      return this.cards.slice(0, 15);
    }
  }

  getCard(id: number): Card | undefined {
    const card = this.cards.find(c => c.id === id);
    if (!card) return undefined;

    // Check if card is accessible for non-premium users
    if (!this.premium.isPremium() && id > 15) {
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
    const accessibleCards = this.premium.isPremium() ? this.cards : this.cards.slice(0, 15);

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
