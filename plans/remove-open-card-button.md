# Remove "Open Card" Button — Show Timer After Card Flip

## Overview

Remove the "Открыть карту" button from the prediction page. The timer block should appear **after** the user clicks on the card to flip it (or immediately if the card was already opened today from saved state). The button's reserved space in the `.action-area` container is preserved for the timer block so layout doesn't shift.

---

## Current Behavior

| Condition | What's Shown |
|-----------|-------------|
| `attemptsRemaining > 0` | Button "Открыть карту" |
| `attemptsRemaining <= 0` | Timer block |

The `showButton` getter controls visibility: button when `true`, timer when `false`.

---

## Desired Behavior

| Condition | What's Shown |
|-----------|-------------|
| Card not yet flipped (`!showCardFace`) | **Nothing** in action area (space reserved) |
| Card flipped (`showCardFace === true`) | **Timer block** (countdown to next reset) |
| Page loaded with saved card (already opened today) | **Timer block** immediately |

The timer block always shows **after** the card has been opened, regardless of attempts remaining.

---

## Changes

### 1. [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

#### a) Remove `showButton` getter (lines 143-145)

Delete the entire getter — it's no longer needed.

#### b) Remove `buttonText` getter (lines 150-159)

Delete the entire getter — the button is removed.

#### c) Remove `onActionButtonClick()` method (lines 164-174)

Delete the entire method — the button is removed.

#### d) Add new `showTimer` getter

```typescript
/**
 * Timer is shown after the card has been opened (flipped).
 * If card was already opened today (restored from saved state), timer shows immediately.
 */
get showTimer(): boolean {
  return this.showCardFace;
}
```

#### e) Keep `purchasePremium()` method (lines 176-193)

This method is still needed for premium purchase flow (called from elsewhere, e.g., ad button or premium button in header). No changes needed.

#### f) Keep `flipCard()` method (lines 108-131)

No changes needed — the card click handler remains. When user clicks the card:
- If back is showing → flips to face, saves card data, timer appears via `showTimer`
- If face is showing → toggles between image and prediction

---

### 2. [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

#### a) Replace the action-area content (lines 6-15)

**Current:**
```html
<div class="action-area">
  <button class="btn-action" *ngIf="showButton" (click)="onActionButtonClick()">
    {{ buttonText }}
  </button>

  <div class="timer-block" *ngIf="!showButton">
    <span class="timer-label">Следующая карта через:</span>
    <span class="timer-value">{{ timer }}</span>
  </div>
</div>
```

**New:**
```html
<div class="action-area">
  <!-- Timer: shown after card is opened -->
  <div class="timer-block" *ngIf="showTimer">
    <span class="timer-label">Следующая карта через:</span>
    <span class="timer-value">{{ timer }}</span>
  </div>
</div>
```

The `.action-area` container remains with its `min-height` to reserve space. When `showTimer` is `false`, the container is empty but still occupies its reserved height — no layout shift.

---

### 3. [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### a) Remove `.btn-action` styles

Delete the `.btn-action` block (lines 230-259) and all its responsive overrides.

**Remove at each breakpoint:**
- 768px: `.btn-action` (lines 387-391)
- 480px: `.btn-action` (lines 472-477)
- 360px: `.btn-action` (lines 523-527)

#### b) Keep `.timer-block` styles

The timer block styles remain unchanged. They already have `min-height: 56px` matching the button's height, so the reserved space is preserved.

#### c) Keep `.action-area` container styles

The `.action-area` container (lines 220-300) remains with its `margin-top: 0` and `margin-bottom: 30px` to preserve vertical spacing.

---

## Layout Stability

```
┌─────────────────────────────────────────────┐
│              .action-area                     │
│  ┌───────────────────────────────────────┐   │
│  │  Timer block (min-height: 56px)       │   │
│  │  ── or empty space (same height) ──   │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  ┌─ attempts-counter (if showCardFace) ────┐  │
│  │  Осталось попыток: 0 / 1               │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

The `.action-area` has `min-height` implicitly from the timer block's `min-height: 56px`. When timer is hidden, the container collapses to 0 but `margin-bottom: 30px` still provides spacing. The card wrapper below won't jump because the action area's margin-bottom is always present.

---

## State Transitions

| State | Card | Timer |
|-------|------|-------|
| Initial load (no saved card) | Back | Hidden (space reserved) |
| User clicks card → flips | Face | Visible |
| Page reload with saved card | Face (restored) | Visible (immediately) |
| Timer reaches midnight | Back (auto-reset) | Hidden (card back again) |

---

## Edge Cases

1. **Page reload with saved card**: `initializeCardState()` sets `showCardFace = true` → `showTimer` returns `true` → timer visible immediately. Correct.

2. **Timer at midnight**: `resetIfNeeded()` clears last card data and resets attempts. Card goes back to showing back side → `showCardFace = false` → `showTimer` returns `false` → timer hidden. User sees card back, clicks to flip, timer reappears. Correct.

3. **Premium purchase**: `purchasePremium()` may set card back to back side → `showCardFace = false` → timer hidden. User clicks card again → flips → timer shows. Correct.

4. **No layout shift**: The `.action-area` container always has `margin-bottom: 30px`. When timer is hidden, the container is empty but the margin still separates it from the card wrapper below.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/pages/prediction/prediction.ts` | Remove `showButton`, `buttonText`, `onActionButtonClick`. Add `showTimer` getter. |
| `src/app/pages/prediction/prediction.html` | Replace button+timer with timer-only block using `*ngIf="showTimer"`. |
| `src/app/pages/prediction/prediction.scss` | Remove `.btn-action` styles and all responsive overrides. Keep `.timer-block` and `.action-area`. |
