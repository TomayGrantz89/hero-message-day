# Fix: Show Card Face (Image) After Closing Enlarged View or Returning to Page

## Problem

On the prediction page, when a user:
1. Opens a card → sees face (image) → flips to prediction (text)
2. Opens the enlarged card overlay (clicks on card)
3. Then either:
   - **Closes the enlarged overlay** (clicks outside)
   - **Navigates away and returns** to the page

**Current (buggy) behavior**: The main card shows the **prediction side** (text).

**Desired behavior**: The main card should show the **face side** (image).

## Root Cause

Two code paths need fixing:

### 1. `closeEnlarged()` — closing the enlarged overlay

File: [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts:307)

```typescript
closeEnlarged(): void {
  this.showEnlarged = false;
  this.enlargedSide = 'face';
}
```

This only hides the overlay but does **not** change `showCardFace` / `showPrediction`. The main card remains in whatever state it was before opening the enlarged view (i.e., `showPrediction = true`).

**Fix**: After closing the enlarged overlay, reset the main card to show the face side:
```typescript
closeEnlarged(): void {
  this.showEnlarged = false;
  this.showCardFace = true;
  this.showPrediction = false;
  this.enlargedSide = 'face';
}
```

### 2. `initializeCardState()` — returning to the page

File: [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts:73)

```typescript
private initializeCardState(): void {
  const lastData = this.attemptService.getLastCardData();
  if (lastData) {
    // ...
    this.showCardFace = true;
    this.showPrediction = true;  // <-- BUG: shows prediction side
  }
}
```

When restoring saved card data, both `showCardFace` and `showPrediction` are set to `true`. Since the template shows the prediction side when `showPrediction = true`, the card displays the prediction text instead of the image.

**Fix**: Show the face side instead:
```typescript
this.showCardFace = true;
this.showPrediction = false;
```

## Changes Summary

| File | Change |
|------|--------|
| `src/app/pages/prediction/prediction.ts` | In `closeEnlarged()`: add `this.showCardFace = true; this.showPrediction = false;` |
| `src/app/pages/prediction/prediction.ts` | In `initializeCardState()`: change `this.showPrediction = true` → `this.showPrediction = false` |

## Verification

- The card data is still saved in `localStorage` via `markPredictionReceived()` — no change needed there
- The prediction text is still accessible via the enlarged overlay (user can tap card to open enlarged view and flip to see prediction)
- The `flipCard()` flow remains unchanged: back → face → prediction → enlarged
- The "Get new card" button logic depends on `showPrediction` — verify it still appears correctly (it checks `showPrediction` for non-premium users)
