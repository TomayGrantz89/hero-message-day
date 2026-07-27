# Prediction Page — Instruction Banner with Apple-Style Design

## Overview

Replace the current timer-only action area with a dynamic Apple-style instruction banner that changes text based on card state. The timer only appears after the prediction (послание) is revealed.

---

## Current Behavior

| State | Card | Timer |
|-------|------|-------|
| 1 — Card back (рубашка) | Back visible | No timer |
| 2 — Card face (картинка) | Image visible | Timer shows (via `showTimer = showCardFace`) |
| 3 — Prediction (послание) | Text visible | Timer shows |

**Problem:** Timer appears too early (as soon as card flips to face), and there's no instruction text guiding the user.

---

## Desired Behavior

| State | Card | Action Area Content |
|-------|------|---------------------|
| 1 — Card back (рубашка) | Back visible | Banner: "Нажмите на карту, чтобы открыть её" |
| 2 — Card face (картинка) | Image visible | Banner: "Нажмите на карту, чтобы получить послание" |
| 3 — Prediction (послание) | Text visible | Timer: "Следующая карта через: HH:MM:SS" |

---

## Changes

### 1. [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

#### a) Add `bannerText` getter

```typescript
get bannerText(): string {
  if (!this.showCardFace) {
    // State 1: card back is showing
    return 'Нажмите на карту, чтобы открыть её';
  }
  if (!this.showPrediction) {
    // State 2: card face (image) is showing, prediction not yet revealed
    return 'Нажмите на карту, чтобы получить послание';
  }
  // State 3: prediction is showing — no banner, timer is shown instead
  return '';
}
```

#### b) Update `showTimer` getter

**Current:**
```typescript
get showTimer(): boolean {
  return this.showCardFace;
}
```

**New:**
```typescript
get showTimer(): boolean {
  return this.showCardFace && this.showPrediction;
}
```

Timer now only shows when the prediction text is visible (state 3), not when the card image is showing (state 2).

---

### 2. [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

Replace the current action-area content with a dynamic banner + timer:

**Current (lines 6-12):**
```html
<div class="action-area">
  <!-- Timer: shown after card is opened -->
  <div class="timer-block" *ngIf="showTimer">
    <span class="timer-label">Следующая карта через:</span>
    <span class="timer-value">{{ timer }}</span>
  </div>
</div>
```

**New:**
```html
<div class="action-area">
  <!-- Instruction banner: shown in states 1 and 2 (before prediction is revealed) -->
  <div class="instruction-banner" *ngIf="!showTimer">
    <span class="instruction-text">{{ bannerText }}</span>
  </div>

  <!-- Timer: shown only in state 3 (after prediction is revealed) -->
  <div class="timer-block" *ngIf="showTimer">
    <span class="timer-label">Следующая карта через:</span>
    <span class="timer-value">{{ timer }}</span>
  </div>
</div>
```

---

### 3. [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### a) Update `.action-area` — reduce `min-height` since we only have one element at a time

**Current:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  min-height: 72px;
  justify-content: flex-start;
  ...
}
```

**New:** Keep the same structure, just ensure `min-height` accommodates the banner (which is slightly taller than the timer block).

#### b) Add `.instruction-banner` styles (Apple-style)

```scss
.action-area {
  // ... existing properties ...

  .instruction-banner {
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 14px;
    padding: 16px 24px;
    text-align: center;
    box-sizing: border-box;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;

    .instruction-text {
      font-size: 1.05rem;
      font-weight: 400;
      color: #3a3a4a;
      line-height: 1.5;
      letter-spacing: 0.2px;
    }
  }
}
```

#### c) Ensure `.timer-block` and `.instruction-banner` have the same `min-height` (56px) to prevent layout shift when switching between them

The timer block already has `min-height: 56px` — the instruction banner should match this exactly.

#### d) Add responsive overrides for `.instruction-banner`

At each breakpoint, add matching sizes:

**768px:**
```scss
.instruction-banner {
  padding: 14px 20px;
  min-height: 52px;

  .instruction-text {
    font-size: 1rem;
  }
}
```

**480px:**
```scss
.instruction-banner {
  padding: 12px 16px;
  min-height: 50px;

  .instruction-text {
    font-size: 0.95rem;
  }
}
```

**360px:**
```scss
.instruction-banner {
  padding: 10px 14px;
  min-height: 46px;

  .instruction-text {
    font-size: 0.9rem;
  }
}
```

---

## Layout Stability Strategy

1. **`.action-area` has `min-height`** — reserves vertical space regardless of content
2. **`.instruction-banner` and `.timer-block` have the same `min-height`** — they occupy identical vertical space, preventing layout shift when switching
3. **`*ngIf` ensures only one is in the DOM** — no overlapping or double-height issues
4. **Text changes in the banner** (state 1 → state 2) don't change the banner height because the text is similar length and padding is fixed
5. **The card itself doesn't move** — the action area is above the card, so changes there don't affect card position

---

## Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                 .action-area                      │
│  ┌───────────────────────────────────────────┐   │
│  │  State 1: Instruction Banner              │   │
│  │  "Нажмите на карту, чтобы открыть её"     │   │
│  │  ── or ──                                 │   │
│  │  State 2: Instruction Banner              │   │
│  │  "Нажмите на карту, чтобы получить        │   │
│  │   послание"                                │   │
│  │  ── or ──                                 │   │
│  │  State 3: Timer Block                     │   │
│  │  "Следующая карта через: 12:34:56"        │   │
│  │  ── Same height (56px), no layout shift ──│   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                 .card-wrapper                     │
│  ┌───────────────────────────────────────────┐   │
│  │  State 1: Card Back (рубашка)             │   │
│  │  State 2: Card Face (картинка + имя)      │   │
│  │  State 3: Prediction Text (послание)      │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## State Transition Table

| # | User Action | Card State | `showCardFace` | `showPrediction` | `showTimer` | Action Area Content |
|---|-------------|------------|----------------|------------------|-------------|---------------------|
| 1 | Page load (no saved card) | Back | false | false | false | Banner: "Нажмите на карту, чтобы открыть её" |
| 2 | Click card (has attempt) | Face image | true | false | false | Banner: "Нажмите на карту, чтобы получить послание" |
| 3 | Click card again | Prediction | true | true | true | Timer: "Следующая карта через: ..." |
| 4 | Click card again | Face image | true | false | false | Banner: "Нажмите на карту, чтобы получить послание" |
| 5 | Click card again | Prediction | true | true | true | Timer: "Следующая карта через: ..." |

> **Note:** States 4 and 5 are toggling between image and prediction (existing behavior via `flipCard()`). The banner/timer follows accordingly.

---

## Edge Cases

1. **Page reload with saved card (already opened today):** `initializeCardState()` sets `showCardFace = true`, `showPrediction = false`. Banner shows "Нажмите на карту, чтобы получить послание". User clicks → prediction reveals → timer shows.

2. **Page reload after prediction was revealed:** Not currently saved — prediction state resets to image view. This is existing behavior and acceptable.

3. **No attempts remaining + card back:** User can't flip. The banner still shows "Нажмите на карту, чтобы открыть её" but clicking does nothing (existing behavior). Consider if this needs a different message — but the user didn't mention this case, so keep as-is.

4. **Premium purchase:** `purchasePremium()` resets card state. Banner returns to state 1 text.

5. **Timer at midnight:** Timer reaches 00:00:00, but the card is still showing prediction. Timer continues showing until user reloads or interacts. This is existing behavior.
