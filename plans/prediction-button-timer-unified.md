# Prediction Page — Unified Button/Timer Area & Premium Notice

## Overview

Unify the button and timer into a single fixed-height container so layout never jumps when switching between them. Add a premium upsell notice below for non-premium users.

---

## Current Problem

1. **Button** (`.btn-action`) and **timer** (`.timer-line`) are separate elements with different heights and different containers
2. When card flips and attempts change, one hides and the other appears → **layout jumps**
3. No premium upsell notice exists below the button/timer area

---

## New Logic (Confirmed with User)

| Condition | What to Show |
|-----------|-------------|
| Has attempts remaining (`attemptsRemaining > 0`) | **Button** (action text varies by state) |
| No attempts remaining (`attemptsRemaining <= 0`) | **Timer** (countdown to next reset) |
| Non-premium user (`!isPremium`) | **Premium notice** below button/timer (always visible, no layout shift) |

Button text logic:
- Card back visible + has attempts → "Открыть карту"
- Card face visible + has attempts + isPremium → "Получить вторую карту"
- No attempts + !isPremium → "Купить премиум"

---

## Changes

### 1. [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

#### a) Update `showButton` getter (line ~144)

**Current:**
```typescript
get showButton(): boolean {
  return !this.showCardFace;
}
```

**New:**
```typescript
get showButton(): boolean {
  return this.attemptsRemaining > 0;
}
```

Button shows whenever there are attempts remaining, regardless of card state.

#### b) Update `buttonText` getter (line ~152)

**Current:**
```typescript
get buttonText(): string {
  if (!this.showCardFace) {
    if (!this.isPremium && this.attemptsRemaining <= 0) {
      return 'Купить премиум';
    }
    return 'Открыть карту';
  }
  return '';
}
```

**New:**
```typescript
get buttonText(): string {
  if (this.attemptsRemaining <= 0) {
    return 'Купить премиум';
  }
  if (!this.showCardFace) {
    return 'Открыть карту';
  }
  // Card is face up and has attempts (premium user getting second card)
  return 'Получить вторую карту';
}
```

#### c) Update `onActionButtonClick` (line ~166)

**Current:**
```typescript
onActionButtonClick(): void {
  if (!this.showCardFace) {
    if (!this.isPremium && this.attemptsRemaining <= 0) {
      this.purchasePremium();
      return;
    }
    this.flipCard();
  }
}
```

**New:**
```typescript
onActionButtonClick(): void {
  if (this.attemptsRemaining <= 0) {
    this.purchasePremium();
    return;
  }
  if (!this.showCardFace) {
    // Card back is showing — flip to open it
    this.flipCard();
  } else {
    // Card is face up, user wants second card — draw new card
    this.drawNewCard();
  }
}
```

---

### 2. [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

Replace the current button section and timer line with a unified container:

**Current (lines 29-42):**
```html
<!-- Button section under the card -->
<div class="button-section" [class.hidden]="!showButton">
  <button class="btn-action" (click)="onActionButtonClick()">
    {{ buttonText }}
  </button>
  <div class="attempts-counter">
    Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
  </div>
</div>

<!-- Timer: shown only when no attempts remaining and card is showing -->
<p class="timer-line" *ngIf="attemptsRemaining <= 0 && showCardFace">
  Следующая карта через: <strong>{{ timer }}</strong>
</p>
```

**New:**
```html
<!-- Unified action area — fixed height, no layout shift -->
<div class="action-area">
  <!-- Button (shown when attempts > 0) -->
  <button class="btn-action" *ngIf="showButton" (click)="onActionButtonClick()">
    {{ buttonText }}
  </button>

  <!-- Timer (shown when attempts <= 0) -->
  <div class="timer-block" *ngIf="!showButton">
    <span class="timer-label">Следующая карта через:</span>
    <span class="timer-value">{{ timer }}</span>
  </div>

  <!-- Attempts counter (always visible when card is face up) -->
  <div class="attempts-counter" *ngIf="showCardFace">
    Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
  </div>

  <!-- Premium upsell notice for non-premium users -->
  <div class="premium-notice" *ngIf="!isPremium">
    Премиум пользователь получает 2 карты в день
  </div>
</div>
```

---

### 3. [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### a) Replace `.button-section` and `.timer-line` with unified `.action-area`

**Remove:**
- `.button-section` (lines 221-273)
- `.timer-line` (lines 275-286)
- All responsive overrides for `.button-section` and `.timer-line`

**Add unified `.action-area`:**
```scss
/* Unified action area — fixed height container, no layout shift */
.action-area {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  min-height: 140px; /* Fixed height to prevent layout shift */
  justify-content: flex-start;

  .btn-action {
    background: #FFFFFF;
    color: #007AFF;
    border: none;
    border-radius: 14px;
    padding: 16px 32px;
    font-size: 1.3rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
    width: 100%;
    text-align: center;
    letter-spacing: 0.3px;
    min-height: 56px; /* Fixed height matching button */
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
  }

  /* Timer block — same height as button, centered content */
  .timer-block {
    width: 100%;
    min-height: 56px; /* Same as button height */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 14px;
    padding: 8px 32px;
    box-sizing: border-box;

    .timer-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 2px;
    }

    .timer-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: #cc3300;
      letter-spacing: 1px;
    }
  }

  .attempts-counter {
    text-align: center;
    font-size: 1.1rem;
    color: #666;
    margin-top: 12px;
    font-weight: 400;

    .attempt-count {
      font-weight: 600;
      color: #0a1e3d;
    }
  }

  /* Premium upsell notice — no layout shift, uses existing space */
  .premium-notice {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 10px;
    font-size: 0.95rem;
    color: #555;
    text-align: center;
    line-height: 1.4;
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(0, 122, 255, 0.15);
  }
}
```

#### b) Responsive overrides

Add at each breakpoint:

**768px:**
```scss
.action-area {
  margin-top: 16px;
  max-width: 280px;
  min-height: 130px;

  .btn-action {
    padding: 14px 28px;
    font-size: 1.2rem;
    min-height: 52px;
  }

  .timer-block {
    min-height: 52px;
    padding: 6px 28px;

    .timer-label {
      font-size: 0.85rem;
    }

    .timer-value {
      font-size: 1.2rem;
    }
  }

  .attempts-counter {
    font-size: 1.05rem;
    margin-top: 10px;
  }

  .premium-notice {
    margin-top: 14px;
    padding: 10px 14px;
    font-size: 0.9rem;
  }
}
```

**480px:**
```scss
.action-area {
  margin-top: 14px;
  max-width: 260px;
  min-height: 120px;

  .btn-action {
    padding: 14px 24px;
    font-size: 1.2rem;
    min-height: 50px;
    border-radius: 12px;
  }

  .timer-block {
    min-height: 50px;
    padding: 6px 24px;

    .timer-label {
      font-size: 0.8rem;
    }

    .timer-value {
      font-size: 1.15rem;
    }
  }

  .attempts-counter {
    font-size: 1rem;
    margin-top: 10px;
  }

  .premium-notice {
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}
```

**360px:**
```scss
.action-area {
  .btn-action {
    padding: 12px 20px;
    font-size: 1rem;
    min-height: 46px;
  }

  .timer-block {
    min-height: 46px;
    padding: 4px 20px;

    .timer-value {
      font-size: 1.05rem;
    }
  }

  .premium-notice {
    font-size: 0.8rem;
    padding: 8px 12px;
  }
}
```

**Landscape (768px):**
```scss
.action-area {
  margin-top: 14px;
}
```

---

## Layout Stability Strategy

The key to preventing layout shift:

1. **`.action-area` has `min-height`** — this reserves vertical space regardless of whether button or timer is shown
2. **Button and timer have the same `min-height`** — they occupy identical vertical space
3. **`*ngIf` is used** — only one of button/timer is in the DOM at a time, but the container maintains its height
4. **`.premium-notice` is always present for non-premium** — it doesn't appear/disappear, avoiding shifts
5. **`.attempts-counter` uses `*ngIf="showCardFace"`** — appears only when card is flipped, but it's below the fixed-height button/timer so it doesn't affect the critical path

---

## Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                 .action-area                      │
│  ┌───────────────────────────────────────────┐   │
│  │  Button (min-height: 56px)                │   │
│  │  OR Timer (min-height: 56px)              │   │
│  │  ── Same height, no layout shift ──       │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌─ attempts-counter (if showCardFace) ────────┐  │
│  │  Осталось попыток: 1 / 2                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ premium-notice (if !isPremium) ────────────┐  │
│  │  Премиум пользователь получает 2 карты в день│  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## State Transitions

| State | Card | Attempts | Button/Timer | Premium Notice |
|-------|------|----------|--------------|----------------|
| Initial (non-premium) | Back | 1 | Button "Открыть карту" | Visible |
| After flip (non-premium) | Face | 0 | Timer | Visible |
| Initial (premium) | Back | 2 | Button "Открыть карту" | Hidden |
| After 1st card (premium) | Face | 1 | Button "Получить вторую карту" | Hidden |
| After 2nd card (premium) | Face | 0 | Timer | Hidden |
| No attempts (non-premium) | Back | 0 | Button "Купить премиум" | Visible |

---

## Edge Cases

1. **Page reload with saved card**: `initializeCardState()` restores card face-up. If premium user had 1 attempt left → button "Получить вторую карту" shows. If 0 attempts → timer shows.
2. **Premium purchase**: `purchasePremium()` resets attempts to 2, card goes back. Button "Открыть карту" shows.
3. **Timer at midnight**: Timer reaches 00:00:00, attempts reset to 1 (or 2 for premium). Button replaces timer automatically via Angular change detection.
4. **Rapid state changes**: `*ngIf` ensures only button OR timer is in DOM. Container `min-height` prevents collapse.
5. **Mobile landscape**: Container width adapts via `max-width`. Button/timer height remains consistent.
