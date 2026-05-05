import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardData, Card } from '../../services/card-data';
import { Attempt } from '../../services/attempt';

interface CollectionCard {
  card: Card;
  owned: boolean;
}

@Component({
  selector: 'app-collection',
  imports: [CommonModule, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection implements OnInit {
  collectionCards: CollectionCard[] = [];
  selectedCard: Card | null = null;
  showDetail = false;
  detailSide: 'face' | 'back' = 'face';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 12; // Default for desktop (will be updated by calculateItemsPerPage)
  totalPages = 1;
  paginatedCards: CollectionCard[] = [];
  pageNumbers: number[] = [];

  constructor(
    private cardData: CardData,
    private attemptService: Attempt
  ) {}

  ngOnInit(): void {
    this.calculateItemsPerPage();
    this.loadCollection();
  }

  @HostListener('window:resize')
  onResize(): void {
    const oldItemsPerPage = this.itemsPerPage;
    this.calculateItemsPerPage();

    // Recalculate current page if items per page changed
    if (oldItemsPerPage !== this.itemsPerPage) {
      const firstItemIndex = (this.currentPage - 1) * oldItemsPerPage;
      this.currentPage = Math.floor(firstItemIndex / this.itemsPerPage) + 1;
      this.updatePagination();
    }
  }

  private calculateItemsPerPage(): void {
    const width = window.innerWidth;

    if (width < 768) { // Mobile
      this.itemsPerPage = 6;
    } else if (width < 1024) { // Tablet
      this.itemsPerPage = 9;
    } else { // Desktop
      this.itemsPerPage = 14; // 14 cards per page (7 columns × 2 rows) for computer version
    }
  }

  private loadCollection(): void {
    const collectedIds = this.attemptService.getCollection();
    const allCards = this.cardData.getAllCards();

    this.collectionCards = allCards.map(card => ({
      card,
      owned: collectedIds.includes(card.id)
    }));

    this.updatePagination();
  }

  private updatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.collectionCards.length / this.itemsPerPage);

    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Calculate paginated cards
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCards = this.collectionCards.slice(startIndex, endIndex);

    // Generate page numbers for pagination controls
    this.generatePageNumbers();
  }

  private generatePageNumbers(): void {
    const maxVisiblePages = 5;
    this.pageNumbers = [];

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        this.pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      const half = Math.floor(maxVisiblePages / 2);
      let start = this.currentPage - half;
      let end = this.currentPage + half;

      if (start < 1) {
        start = 1;
        end = maxVisiblePages;
      }

      if (end > this.totalPages) {
        end = this.totalPages;
        start = end - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        this.pageNumbers.push(i);
      }
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  selectCard(item: CollectionCard): void {
    if (!item.owned) {
      return; // Do nothing for locked cards
    }
    this.selectedCard = item.card;
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

  getCollectedCount(): number {
    return this.collectionCards.filter(item => item.owned).length;
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

  getPageInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.collectionCards.length);
    return `${start}-${end} из ${this.collectionCards.length}`;
  }
}
