# Plan: Premium "Новая карта" Button & Counter Fix

## Summary

Three changes to the prediction page's premium flow:

1. **Button text**: "Получить вторую карту" → "Новая карта"
2. **Counter update on premium purchase**: Immediately reflect correct attempts `1/2` or `2/2`
3. **New card logic**: "Новая карта" shows new card face-up immediately (no flip from back)

---

## Changes Required

### File: `src/app/pages/prediction/prediction.ts`

#### Change 1 — Button text getter (line ~160)

Replace `'Получить вторую карту'` with `'Новая карта'`:

```typescript
get buttonText(): string {
  if (this.attemptsRemaining <= 0) {
    return 'Купить премиум';
  }
  if (!this.showCardFace) {
    return 'Открыть карту';
  }
  // Card is face up and has attempts remaining
  return 'Новая карта';
}
```

#### Change 2 — `purchasePremium()` method (lines 208-230)

The current logic has a bug: after `refreshPredictionAttempts()` sets attempts to 2, it then calls `setAttempts(1)` when a card is already open. But the counter shows `attemptsRemaining / maxAttemptsPerDay`. We need to ensure:

- If card is already open (1 attempt used): counter shows `1 / 2`
- If no card opened: counter shows `2 / 2`

Current code already does this correctly via `setAttempts(1)` for the open-card case. But we need to verify the flow works end-to-end.

**No change needed here** — the existing logic is correct:
- `refreshPredictionAttempts()` → sets attempts to 2
- If `showCardFace` is true → `setAttempts(1)` → counter shows `1 / 2`
- If `showCardFace` is false → attempts remain 2 → counter shows `2 / 2`

#### Change 3 — `drawNewCard()` method (lines 180-206) — **Major change**

Current behavior: hides card face, shows back, loads new card (flip animation).
New behavior: keep current card visible, load new card face-up immediately.

Replace the method:

```typescript
drawNewCard(): void {
  if (this.attemptsRemaining > 0) {
    const used = this.attemptService.useAttempt();
    if (used) {
      this.updateAttempts();
      // Reset prediction received flag so the new card can be tracked
      this.attemptService.resetPredictionReceived();

      // Load new card data immediately (face-up, no flip)
      this.loadRandomCard(true, true);

      // Ensure card is shown face-up
      this.showCardFace = true;
      this.showPrediction = false;
    }
  }
}
```

Key differences from current:
- ❌ No `showCardFace = false` (don't hide current card)
- ❌ No `card = null` (don't clear current card)
- ❌ No `setTimeout` delay
- ✅ Load new card data immediately
- ✅ Set `showCardFace = true` so new card appears face-up
- ✅ Set `showPrediction = false` so image is shown first

#### Change 4 — `onActionButtonClick()` (lines 166-178)

The current logic calls `drawNewCard()` when card is face up and attempts > 0. This is correct — no change needed here since `drawNewCard()` now handles the new behavior.

---

### File: `src/app/pages/prediction/prediction.html`

**No changes needed.** The template already:
- Uses `buttonText` getter (will show "Новая карта")
- Uses `attemptsRemaining / maxAttemptsPerDay` for counter (will update reactively)
- Uses `showCardFace` to control card visibility (new card will be face-up)

---

## Flow Diagrams

### Current Flow (Premium Purchase + Second Card)

```
User clicks "Купить премиум"
  → purchasePremium()
  → refreshPredictionAttempts() → attempts = 2
  → if card open: setAttempts(1) → counter = 1/2
  → if no card: attempts stay 2 → counter = 2/2
  → Button shows "Получить вторую карту" (will change to "Новая карта")

User clicks "Получить вторую карту" (→ "Новая карта")
  → drawNewCard()
  → useAttempt() → attempts = 0
  → showCardFace = false, card = null (HIDE current card)
  → setTimeout → loadRandomCard() (SHOW back, then flip)
```

### New Flow (Premium Purchase + New Card)

```
User clicks "Купить премиум"
  → purchasePremium()
  → refreshPredictionAttempts() → attempts = 2
  → if card open: setAttempts(1) → counter = 1/2
  → if no card: attempts stay 2 → counter = 2/2
  → Button shows "Новая карта"

User clicks "Новая карта"
  → drawNewCard()
  → useAttempt() → attempts = 0
  → loadRandomCard() immediately (KEEP current card visible)
  → showCardFace = true (new card appears face-up)
  → showPrediction = false (show image first)
```

---

## Summary of Changes

| File | Change | Type |
|------|--------|------|
| `prediction.ts:160` | Button text: `'Получить вторую карту'` → `'Новая карта'` | Simple text change |
| `prediction.ts:180-206` | `drawNewCard()`: Remove flip-to-back logic, show new card face-up immediately | Logic rewrite |
