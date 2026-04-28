import { Injectable } from '@angular/core';

export interface Card {
  id: number;
  name: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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

  constructor() {
    this.generateMockData();
  }

  private generateMockData(): void {
    // Generate 40 cards
    for (let i = 1; i <= 40; i++) {
      const rarities: Card['rarity'][] = ['common', 'rare', 'epic', 'legendary'];
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      this.cards.push({
        id: i,
        name: `Card ${i}`,
        imageUrl: `assets/card${i}.jpg`,
        rarity,
        description: `Description for card ${i}`,
        history: `Historical background for card ${i}. This card has a rich history dating back centuries.`,
      });
    }

    // Generate 80 predictions, each linked to a random card
    for (let i = 1; i <= 80; i++) {
      this.predictions.push({
        id: i,
        text: `Prediction ${i}: Today you will encounter something unexpected.`,
        cardId: Math.floor(Math.random() * 40) + 1,
      });
    }
  }

  getAllCards(): Card[] {
    return this.cards;
  }

  getCard(id: number): Card | undefined {
    return this.cards.find(c => c.id === id);
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

  getPredictionsForCard(cardId: number): PredictionItem[] {
    return this.predictions.filter(p => p.cardId === cardId);
  }

  // Simulate getting a new card with dynamic chance based on collection completion
  getNewCard(userCardIds: number[]): Card {
    const newCards = this.cards.filter(c => !userCardIds.includes(c.id));
    const totalCards = this.cards.length;
    const collectedCount = userCardIds.length;
    const collectionPercentage = totalCards > 0 ? (collectedCount / totalCards) * 100 : 0;

    // Base chance is 40%
    let newCardChance = 0.4;

    // Adjust chance based on collection percentage
    if (collectionPercentage < 50) {
      // Less than 50% collected - increase chance (e.g., +20%)
      newCardChance = 0.6;
    } else if (collectionPercentage > 50) {
      // More than 50% collected - decrease chance (e.g., -20%)
      newCardChance = 0.2;
    }
    // If exactly 50%, keep base chance

    const chance = Math.random();
    if (newCards.length > 0 && chance < newCardChance) {
      // Get a new card (not in collection)
      return newCards[Math.floor(Math.random() * newCards.length)];
    } else {
      // Otherwise get any random card (including duplicates)
      return this.cards[Math.floor(Math.random() * this.cards.length)];
    }
  }
}
