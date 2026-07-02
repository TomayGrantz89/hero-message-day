# Prediction Page: Layout & Button Fixes

## Overview

Three changes requested for the prediction page:

1. **Change subtitle text** — from "Нажмите на карту, чтобы перевернуть её" to "Нажмите на карту, чтобы открыть её"
2. **Show "Купить премиум" button** — for free users who have exhausted their attempts
3. **Vertically center the composition** — equal spacing above the card and below the attempts counter

---

## 1. Subtitle Text Change

### Current (prediction.html:3)

```html
<p class="subtitle">{{ showPrediction ? 'Нажмите на карту, чтобы увеличить и перевернуть её' : 'Нажмите на карту, чтобы перевернуть её' }}</p>
```

### Change to

```html
<p class="subtitle">{{ showPrediction ? 'Нажмите на карту, чтобы увеличить и перевернуть её' : 'Нажмите на карту, чтобы открыть её' }}</p>
```

Only the second string changes: `перевернуть` → `открыть`.

---

## 2. "Купить премиум" Button for Free Users with 0 Attempts

### Current Logic (prediction.ts)

The `showButton` getter (line 174-185) returns `true` only when:
- Card is not yet opened (back side up) — shows "Открыть карту"
- Card is opened AND user is premium AND has remaining attempts — shows "Получить вторую карту"

**Problem**: When a free user has 0 attempts remaining and the card is not yet opened, the button is hidden entirely. The user sees the card back but has no way to interact — they're stuck.

### Required Behavior

When a free (non-premium) user has 0 attempts remaining:
- The button should appear with text **"Купить премиум"**
- Clicking it should trigger the premium purchase flow (call `purchasePremium()`)

### Changes Needed

#### prediction.ts — `showButton` getter

Add a condition: show button when card is not opened AND user is not premium AND attempts are 0.

```typescript
get showButton(): boolean {
  // Card not yet opened
  if (!this.showCardFace && !this.showPrediction) {
    return true; // show button regardless (either "Открыть карту" or "Купить премиум")
  }
  // Card opened + premium + has attempts
  if ((this.showCardFace || this.showPrediction) && this.isPremium && this.attemptsRemaining > 0) {
    return true;
  }
  return false;
}
```

#### prediction.ts — `buttonText` getter

Add a condition: when card is not opened, user is not premium, and attempts are 0 → show "Купить премиум".

```typescript
get buttonText(): string {
  if (!this.showCardFace && !this.showPrediction) {
    if (!this.isPremium && this.attemptsRemaining <= 0) {
      return 'Купить премиум';
    }
    return 'Открыть карту';
  }
  if ((this.showCardFace || this.showPrediction) && this.isPremium && this.attemptsRemaining > 0) {
    return 'Получить вторую карту';
  }
  return '';
}
```

#### prediction.ts — `onActionButtonClick()` method

Handle the "Купить премиум" click:

```typescript
onActionButtonClick(): void {
  if (!this.showCardFace && !this.showPrediction) {
    if (!this.isPremium && this.attemptsRemaining <= 0) {
      this.purchasePremium();
      return;
    }
    // Card not opened — flip it (uses an attempt)
    this.flipCard();
  } else if ((this.showCardFace || this.showPrediction) && this.isPremium && this.attemptsRemaining > 0) {
    // Premium user wants a second card
    this.drawNewCard();
  }
}
```

---

## 3. Vertically Center the Composition

### Current Layout Problem

The `.main` section uses `flex: 1` with `flex-direction: column` and `align-items: center`. Content starts at the top of `.main`, leaving uneven space:
- Large gap between top-bar and card
- Small gap between attempts counter and bottom menu

### Required Layout

Space above the card (between subtitle and card top) should be **approximately equal** to space below the attempts counter (between counter and bottom menu).

### Changes Needed

#### prediction.scss — `.main` styles

Change `.main` from `flex: 1` (which fills space but doesn't center) to use `flex: 1` with `justify-content: center` to vertically center the content block.

```scss
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;  // ADD THIS
}
```

#### prediction.scss — Adjust margins

Reduce the large fixed margins that push content down:

- `.subtitle` `margin-bottom`: 40px → 20px (default), 30px → 20px (768px), 25px → 16px (480px)
- `.card-wrapper` `margin`: 30px auto → 10px auto (default), 20px auto → 8px auto (768px)
- `.button-section` `margin-top`: 40px → 20px (default), 30px → 16px (768px), 25px → 14px (480px)

These reduced margins, combined with `justify-content: center`, will naturally center the card+button block vertically.

#### prediction.scss — Remove `.header` section (if unused)

The `.header` styles (lines 15-49) define a header with `h1` and `.ad-button` that don't appear in the HTML template. If this is dead code, it can be removed to avoid confusion. However, this is optional and low priority.

---

## Summary of Files to Change

| File | Changes |
|------|---------|
| `src/app/pages/prediction/prediction.html` | Line 3: change `перевернуть` → `открыть` |
| `src/app/pages/prediction/prediction.ts` | `showButton` getter: add condition for free user with 0 attempts |
| `src/app/pages/prediction/prediction.ts` | `buttonText` getter: return "Купить премиум" for free user with 0 attempts |
| `src/app/pages/prediction/prediction.ts` | `onActionButtonClick()`: handle "Купить премиум" click → call `purchasePremium()` |
| `src/app/pages/prediction/prediction.scss` | `.main`: add `justify-content: center` |
| `src/app/pages/prediction/prediction.scss` | Reduce `.subtitle` `margin-bottom` values |
| `src/app/pages/prediction/prediction.scss` | Reduce `.card-wrapper` `margin` values |
| `src/app/pages/prediction/prediction.scss` | Reduce `.button-section` `margin-top` values |

## Visual Flow (Mermaid)

```mermaid
flowchart TD
    A[Prediction Page Loads] --> B{Card opened today?}
    B -->|Yes| C[Show card face image]
    B -->|No| D[Show card back]
    D --> E{Free user + 0 attempts?}
    E -->|Yes| F[Show "Купить премиум" button]
    E -->|No| G[Show "Открыть карту" button]
    F --> H[Click → purchasePremium]
    G --> I[Click → flipCard uses attempt]
    C --> J[Show face + attempts counter]
    J --> K{Premium + has attempts?}
    K -->|Yes| L[Show "Получить вторую карту"]
    K -->|No| M[Hide button, show timer if 0 attempts]
```

## Verification Steps

1. **Subtitle**: Load page with card back — see "Нажмите на карту, чтобы открыть её"
2. **Free user, 0 attempts**: Clear localStorage attempts, ensure `isPremium=false` — see "Купить премиум" button, clicking it activates premium
3. **Free user, 1 attempt**: See "Открыть карту" button, clicking flips card
4. **Premium user, 1+ attempts**: After opening card, see "Получить вторую карту" button
5. **Vertical centering**: On various screen sizes (360px, 480px, 768px+), verify space above card ≈ space below attempts counter
