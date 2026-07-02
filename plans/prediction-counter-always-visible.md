# Plan: Always-Visible Attempts Counter on Prediction Page

## Problem

Currently, the attempts counter (`Осталось попыток: X / Y`) is only shown when `showCardFace` is `true` — i.e., after the user has flipped a card. This means:

- **Premium user, no card opened yet**: Has `2/2` attempts but sees **no counter** — counter is hidden because `showCardFace = false`
- **Premium user, card already opened**: Shows `1/2` — works correctly because `showCardFace = true`
- **Non-premium user**: Has `1/1` attempt but sees **no counter** until they flip the card

**Desired behavior**: The counter must be **always visible** from the moment the page loads, regardless of card state. It should update instantly when attempts change.

## Root Cause

In [`src/app/pages/prediction/prediction.html`](../src/app/pages/prediction/prediction.html:43), the counter is gated by `showCardFace`:

```html
<div class="attempts-counter" *ngIf="showCardFace">
    Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
</div>
```

## Solution

### Change 1: Template — Remove `*ngIf` condition on counter

**File**: [`src/app/pages/prediction/prediction.html`](../src/app/pages/prediction/prediction.html:43)

Remove `*ngIf="showCardFace"` so the counter is always rendered:

```diff
- <div class="attempts-counter" *ngIf="showCardFace">
+ <div class="attempts-counter">
    Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
  </div>
```

### Change 2: Component — Ensure `attemptsRemaining` and `maxAttemptsPerDay` are set before view renders

**File**: [`src/app/pages/prediction/prediction.ts`](../src/app/pages/prediction/prediction.ts:33)

The current `ngOnInit()` already calls `updatePremiumStatus()` and `updateAttempts()` before `initializeCardState()`, so the values are available immediately. No changes needed in the component logic — the data flow is already correct:

```typescript
ngOnInit(): void {
  this.updatePremiumStatus();  // sets isPremium, maxAttemptsPerDay
  this.updateAttempts();       // sets attemptsRemaining
  this.startTimer();
  this.initializeCardState();
}
```

### Change 3: CSS — Ensure counter is styled for always-visible state

**File**: [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss:289)

The counter already has `margin-top: 12px` which provides spacing from the button/timer above it. When the counter is always visible, it will consistently appear below the action button (or timer when attempts = 0). No CSS changes needed — the existing layout handles this correctly because:

- When `showButton` is true → button shown → counter below it
- When `showButton` is false → timer shown → counter below it
- The `.action-area` has `min-height: 140px` to prevent layout shift

## Visual States After Fix

| Scenario | Counter | Button/Timer |
|----------|---------|-------------|
| Non-premium, no card opened | `1/1` | Button: "Открыть карту" |
| Non-premium, card opened | `0/1` | Timer shown |
| Premium, no card opened | `2/2` | Button: "Открыть карту" |
| Premium, card opened (1 used) | `1/2` | Button: "Получить вторую карту" |
| Premium, both cards used | `0/2` | Timer shown |

## Changes Summary

| File | Change |
|------|--------|
| `src/app/pages/prediction/prediction.html` | Remove `*ngIf="showCardFace"` from `.attempts-counter` div |

## Verification

1. Load prediction page as non-premium user → counter shows `1/1` immediately
2. Flip card → counter updates to `0/1`, timer appears
3. Purchase premium → counter updates to `2/2` (or `1/2` if card was open)
4. Load prediction page as premium user with no card opened → counter shows `2/2` immediately
5. Load prediction page as premium user with card opened → counter shows `1/2` immediately
6. Counter never disappears — always visible in all states
