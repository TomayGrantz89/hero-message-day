# Plan: Premium Locked Cards in Collection

## Overview

Currently, non-premium users only see 14 cards in the collection (filtered by `card-data.ts`). The requirement is to show **all 64 cards** to non-premium users, but visually distinguish the ones they don't own (cards 15-64) with an Apple-style blurred dark-gray overlay and a lock icon. Premium users see all cards normally.

---

## Changes Required

### 1. `src/app/services/card-data.ts` — Remove premium filtering from `getAllCards()`

**Problem:** `getAllCards()` currently returns only 14 cards for non-premium users. This prevents the collection from rendering all 64 cards.

**Change:** Remove the premium check in `getAllCards()` so it always returns all 64 cards. The premium filtering will be handled in the collection component instead (visually, not by data filtering).

```typescript
getAllCards(): Card[] {
  return this.cards; // Always return all 64 cards
}
```

### 2. `src/app/pages/collection/collection.ts` — Track which cards are premium-locked

**Changes:**
- Remove the `totalCards` property that limited to 14 for non-premium (line 120)
- Add a `showPremiumMessage` boolean property (default `false`)
- Add an `onLockClick()` method that sets `showPremiumMessage = true`
- The `owned` flag already comes from `attemptService.getCollection()` — cards 15-64 will naturally be `owned: false` for non-premium users
- Keep `isPremium` check for determining which cards are "locked" (not owned AND not premium)

**Key logic:**
- A card is "locked" if `!item.owned && !isPremium`
- A card is "owned" if `item.owned === true`
- Premium users see all cards as owned/unlocked

### 3. `src/app/pages/collection/collection.html` — Template changes

**For locked cards (both swipe and desktop):**
Replace the current locked card rendering (which shows card back image) with:

```html
<div class="card-item" [class.card-item--locked]="!item.owned && !isPremium" ...>
  <!-- Card image always shown (blurred via CSS for locked) -->
  <div class="card-image" 
       [style.backgroundImage]="'url(' + item.card.imageUrl + ')'"
       [class.card-image--blurred]="!item.owned && !isPremium">
  </div>
  <!-- Lock icon overlay (only for locked cards) -->
  <div class="lock-overlay" *ngIf="!item.owned && !isPremium" (click)="onLockClick($event)">
    <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  </div>
</div>
```

**Premium message (below all cards):**
```html
<div class="premium-message" *ngIf="showPremiumMessage">
  Пользователям премиума доступны все карты
</div>
```

### 4. `src/app/pages/collection/collection.scss` — New styles + cleanup

#### New styles to add:

**Locked card with blurred image:**
```scss
.card-item--locked {
  position: relative;
  cursor: pointer; // Allow clicking the lock icon

  .card-image--blurred {
    filter: blur(8px) brightness(0.5);
    -webkit-filter: blur(8px) brightness(0.5);
    transform: scale(1.05); // Hide blur edges
    background-color: #2a2a2e; // Dark gray base
  }
}
```

**Lock overlay (Apple-style):**
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
  padding: 6px;
  z-index: 2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  .lock-icon {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.7); // Apple-style subtle white
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:active {
      opacity: 1;
    }
  }
}
```

**Premium message:**
```scss
.premium-message {
  text-align: center;
  padding: 16px;
  margin-top: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: rgba(60, 60, 67, 0.7);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Styles to remove (unused):

The following CSS blocks are **not used** in the current template and should be removed:

1. `.header` block (lines 17-43) — No `.header` element in `collection.html`
2. `.detail-view` block (lines 226-370) — No `.detail-view` element; the detail view uses `.enlarged-card-overlay`
3. `.premium-benefits` block (lines 492-529) — No `.premium-benefits` element in template
4. `.fixed-home-link` references (lines 595-603) — No such element in template
5. `.premium-btn` references (lines 605-614) — No such element in template
6. `.premium-status` references (lines 616-625) — No such element in template
7. `.card-name` references (lines 191-193, 215-217, 544-546) — No `.card-name` in template
8. `.detail-view` mobile styles (lines 627-653, 743-780, 858-881, 902-907, 968-989)
9. `.detail-side.back` styles (lines 756-770, 976-988)
10. `.detail-controls` styles (lines 771-780)
11. `.detail-card` styles (lines 861-868)
12. `.header .stats` duplicate at lines 946-959 (already defined inside `.header` block)

### 5. Lock Icon SVG

Use an Apple-style lock icon inline in the template (no separate file needed):

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
```

This matches the Apple SF Symbols lock icon style — thin, rounded, minimal.

---

## Implementation Order

1. **`card-data.ts`** — Remove premium filtering from `getAllCards()`
2. **`collection.ts`** — Add `showPremiumMessage` and `onLockClick()` method
3. **`collection.html`** — Update locked card rendering, add lock overlay and premium message
4. **`collection.scss`** — Add new styles, remove unused styles

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/services/card-data.ts` | Remove premium check in `getAllCards()` (line 58-63) |
| `src/app/pages/collection/collection.ts` | Add `showPremiumMessage` property, `onLockClick()` method |
| `src/app/pages/collection/collection.html` | Update locked card rendering, add lock overlay + premium message |
| `src/app/pages/collection/collection.scss` | Add locked card styles, remove ~300 lines of unused CSS |

---

## Visual Behavior

| State | Appearance |
|-------|-----------|
| **Owned card** (any user) | Normal card image with owned border |
| **Locked card** (non-premium, cards 15-64) | Card image with dark gray blur + lock icon in top-right |
| **Premium user** | All 64 cards shown normally as owned |
| **Lock icon click** | Premium message fades in below all cards |
