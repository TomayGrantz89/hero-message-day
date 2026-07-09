# Plan: Three-State Card Display in Collection

> **Note:** This plan supersedes the previous `plans/collection-premium-locked-cards.md`.

## Overview

Currently, the collection page shows cards in two states: **owned** (image face-up) and **locked** (blurred dark gray + lock icon). The user wants a more nuanced three-state system that distinguishes between:

1. **Owned cards** — image face-up (any user, any card they've collected)
2. **Accessible but not yet obtained** — card back face-up (non-premium, cards 1-14 not yet received)
3. **Locked / inaccessible** — dark gray blurred background + Apple-style lock icon (non-premium, cards 15-64)

Premium users see all cards as state 1 (owned) or state 2 (not yet obtained, card back).

---

## Current Architecture

### Data Flow

```
card-data.ts: getAllCards() → returns all 64 cards (no filtering)
attempt.ts: getCollection() → returns array of collected card IDs from localStorage
collection.ts: loadCollection() → maps all cards with { card, owned: collectedIds.includes(card.id) }
```

### Current `CollectionCard` Interface

```typescript
interface CollectionCard {
  card: Card | null;
  owned: boolean;
  isPlaceholder?: boolean;
}
```

### Current Visual States

| Condition | Visual |
|-----------|--------|
| `item.owned === true` | Card image, border highlight |
| `!item.owned && !isPremium` | Blurred dark image + lock icon |
| `isPremium && !item.owned` | Card image (same as owned) |

---

## Required Changes

### 1. `src/app/pages/collection/collection.ts` — Add `cardState` to CollectionCard

**New `CollectionCard` interface:**

```typescript
type CardState = 'owned' | 'available' | 'locked';

interface CollectionCard {
  card: Card | null;
  owned: boolean;
  state: CardState;  // 'owned' | 'available' | 'locked'
  isPlaceholder?: boolean;
}
```

**New logic in `loadCollection()`:**

```typescript
private loadCollection(): void {
  const collectedIds = this.attemptService.getCollection();
  const allCards = this.cardData.getAllCards();
  const isPremium = this.isPremium;

  this.collectionCards = allCards.map(card => {
    const owned = collectedIds.includes(card.id);
    let state: CardState;

    if (owned) {
      state = 'owned';
    } else if (isPremium) {
      // Premium: all unowned cards show as card back (available)
      state = 'available';
    } else {
      // Non-premium: cards 1-14 are available, 15-64 are locked
      state = card.id <= 14 ? 'available' : 'locked';
    }

    return { card, owned, state };
  });

  this.buildSwipePages();
}
```

**Update `selectCard()`:**

```typescript
selectCard(item: CollectionCard): void {
  if (item.state === 'locked') {
    return; // Cannot open locked cards
  }
  this.selectedCard = item.card;
  this.showDetail = true;
  this.detailSide = 'face';
}
```

**Update `getCollectedCount()`** — no change needed, already filters by `owned`.

### 2. `src/app/pages/collection/collection.html` — Template Changes

#### Swipe Carousel (mobile)

Replace the current card rendering block with three distinct visual states:

```html
<div class="card-item"
  [class.card-item--owned]="item.state === 'owned'"
  [class.card-item--available]="item.state === 'available'"
  [class.card-item--locked]="item.state === 'locked'"
  *ngIf="!item.isPlaceholder"
  (click)="selectCard(item)">

  <!-- State 1: Owned — show card image face-up -->
  <div class="card-image" *ngIf="item.state === 'owned'"
    [style.backgroundImage]="'url(' + item.card!.imageUrl + ')'">
  </div>

  <!-- State 2: Available (not owned) — show card back -->
  <div class="card-back" *ngIf="item.state === 'available'">
    <div class="card-back-image"></div>
  </div>

  <!-- State 3: Locked — dark gray blurred + lock icon -->
  <ng-container *ngIf="item.state === 'locked'">
    <div class="card-image card-image--blurred"
      [style.backgroundImage]="'url(' + item.card!.imageUrl + ')'">
    </div>
    <div class="lock-overlay" (click)="onLockClick($event)">
      <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
  </ng-container>
</div>
```

#### Desktop Grid

Apply the same three-state pattern to the desktop grid section.

### 3. `src/app/pages/collection/collection.scss` — CSS Changes

#### New: Card Back State

```scss
.card-item--available {
  cursor: pointer;
  border: 1px solid #555;
  position: relative;
  overflow: hidden;

  .card-back {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .card-back-image {
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      background-image: url('/assets/back/back.png');
      background-size: cover;
      background-position: center;
      border-radius: 6px;
    }
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
}
```

#### Update: Locked State (Apple-style dark gray blurred)

The current `.card-item--locked` already has blur + brightness. Update to be more Apple-like:

```scss
.card-item--locked {
  cursor: default;
  position: relative;
  border: 1px solid #3a3a3c;
  overflow: hidden;
  background: #2a2a2e;

  .card-image--blurred {
    filter: blur(12px) brightness(0.35) saturate(0.3);
    -webkit-filter: blur(12px) brightness(0.35) saturate(0.3);
    transform: scale(1.1);
    background-color: #2a2a2e;
    opacity: 0.6;
  }

  &:hover {
    transform: none !important;
    box-shadow: none !important;
  }
}
```

#### Update: Lock Overlay (Apple-style)

```scss
.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
  z-index: 2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  .lock-icon {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.75);
    opacity: 0.85;
    transition: opacity 0.2s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));

    &:active {
      opacity: 1;
    }
  }
}
```

#### Keep: Owned State (already exists)

```scss
.card-item--owned {
  border: 2px solid #0D0528;
  box-shadow: 0 0 6px rgba(13, 5, 40, 0.35);
}
```

---

## Visual Behavior Matrix

| User Type | Card ID Range | Collected? | State | Visual |
|-----------|--------------|------------|-------|--------|
| Premium | 1-64 | Yes | `owned` | Image face-up, owned border |
| Premium | 1-64 | No | `available` | Card back (back.png) |
| Non-premium | 1-14 | Yes | `owned` | Image face-up, owned border |
| Non-premium | 1-14 | No | `available` | Card back (back.png) |
| Non-premium | 15-64 | No (always) | `locked` | Dark gray blurred + lock icon |

---

## Interaction Rules

| Action | Owned | Available (card back) | Locked |
|--------|-------|----------------------|--------|
| Click/tap card | Opens enlarged card detail | Opens enlarged card detail | Nothing (lock icon click shows premium message) |
| Lock icon click | N/A | N/A | Shows premium message |
| Hover (desktop) | Lift + shadow | Lift + shadow | No hover effect |
| **Premium purchase** | N/A | N/A | Immediately refreshes all locked → available |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/pages/collection/collection.ts` | Add `CardState` type, update `CollectionCard` interface, update `loadCollection()` logic, update `selectCard()` |
| `src/app/pages/collection/collection.html` | Replace card rendering with three-state conditional templates (both swipe and desktop) |
| `src/app/pages/collection/collection.scss` | Add `.card-item--available` + `.card-back` styles, update `.card-item--locked` for Apple-style dark gray blur |

---

## Edge Cases

1. **Premium purchase mid-session**: `purchasePremium()` must call `this.loadCollection()` after setting `this.isPremium = true` to immediately refresh all card states without page reload. Locked cards (15-64) become available (card back).

2. **New card obtained**: When a card is added to collection via prediction, the collection page needs to reflect this on next visit (already handled since `loadCollection()` reads from localStorage each time).

3. **Premium expiry**: If premium is deactivated, on next collection visit, cards 15-64 will show as locked (correct behavior).

4. **Empty collection**: If no cards collected yet, non-premium sees 14 card backs + 50 locked cards. Premium sees 64 card backs.

---

## Implementation Order

1. Update `collection.ts` — new types and logic
2. Update `collection.html` — three-state template
3. Update `collection.scss` — new styles
4. Test all states and transitions
