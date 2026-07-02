# Fix: Large Gap on Last Collection Page

## Problem

On the last swipe page, when there are fewer cards than `cardsPerSwipe` (e.g., 5 cards out of 14 total, with 9 per page), CSS Grid with `grid-template-columns: repeat(3, 1fr)` distributes them unevenly:

```
Row 1: [card] [card] [card]  ← 3 cards, normal spacing
Row 2: [card] [card]         ← 2 cards, but grid reserves space for 3rd column
```

The grid still allocates vertical space for 3 rows, but since rows 2 and 3 are incomplete, the cards in row 2 stretch vertically to fill the available container height, creating a larger-than-normal gap between row 1 and row 2.

## Solution

Add invisible placeholder `<div>` elements to the last page so the grid always has exactly `cardsPerSwipe` items (9 for portrait, 8 for landscape). This ensures consistent row heights and gaps across all pages.

## Changes

### 1. [`collection.ts`](src/app/pages/collection/collection.ts:7) — Update interface

```typescript
interface CollectionCard {
  card: Card | null;    // null for placeholders
  owned: boolean;
  isPlaceholder?: boolean;
}
```

### 2. [`collection.ts`](src/app/pages/collection/collection.ts:91) — Update `buildSwipePages()`

After building pages, pad the last page with placeholders:

```typescript
private buildSwipePages(): void {
    this.swipePages = [];
    for (let i = 0; i < this.collectionCards.length; i += this.cardsPerSwipe) {
        this.swipePages.push(this.collectionCards.slice(i, i + this.cardsPerSwipe));
    }

    // Pad the last page with invisible placeholders to maintain grid spacing
    const lastPage = this.swipePages[this.swipePages.length - 1];
    if (lastPage && lastPage.length < this.cardsPerSwipe) {
        const placeholdersNeeded = this.cardsPerSwipe - lastPage.length;
        for (let p = 0; p < placeholdersNeeded; p++) {
            lastPage.push({ card: null, owned: false, isPlaceholder: true });
        }
    }

    // Reset to first page if current is out of bounds
    if (this.currentSwipePage >= this.swipePages.length && this.swipePages.length > 0) {
        this.currentSwipePage = this.swipePages.length - 1;
    } else if (this.currentSwipePage < 0) {
        this.currentSwipePage = 0;
    }
}
```

### 3. [`collection.html`](src/app/pages/collection/collection.html:14-19) — Update template

Replace the current card loop with conditional rendering for placeholders:

```html
<div class="swipe-page" *ngFor="let page of swipePages">
  <ng-container *ngFor="let item of page">
    <!-- Placeholder (invisible, maintains grid spacing) -->
    <div class="card-item card-item--placeholder" *ngIf="item.isPlaceholder"></div>
    
    <!-- Real card -->
    <div class="card-item" [class.card-item--locked]="!item.owned" [class.card-item--owned]="item.owned"
         *ngIf="!item.isPlaceholder" (click)="selectCard(item)">
      <div class="card-image" *ngIf="item.owned" [style.backgroundImage]="'url(' + item.card.imageUrl + ')'"></div>
    </div>
  </ng-container>
</div>
```

### 4. [`collection.scss`](src/app/pages/collection/collection.scss:138) — Add placeholder styles

After `.card-item--locked` block, add:

```scss
.card-item--placeholder {
    visibility: hidden;
    pointer-events: none;
    aspect-ratio: 2/3;
}
```

## Result

Last page with 5 cards (14 total, 9 per page):
```
[card] [card] [card]      ← row 1: real cards
[card] [card] [invisible] ← row 2: 2 real + 1 placeholder
[invisible] [invisible] [invisible] ← row 3: all placeholders
```

All rows have equal height, all gaps are consistent (10px as defined by `gap`).
