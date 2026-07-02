# Prediction Card — Premium Flip Animation (iOS-style)

## Overview

Three animation enhancements to make the prediction card flip feel like a premium physical card — heavy, glossy, and alive.

---

## 1. Effect: "Вылет в лицо" (Lift-to-Face Scale Pulse)

### Concept

When the card flips, it should briefly feel like the girl is lifting a heavy card off the table toward her eyes. This is achieved by:

- **Scaling up** the card by ~7% (`scale(1.07)`) during the flip animation
- **Returning to normal scale** (`scale(1)`) at the end of the flip
- The scale change is **synchronized** with the rotation so the card appears to "breathe" — expanding slightly as it rotates, then settling back

### Implementation

**File:** [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:87)

The current flip uses a single `transform: rotateY(180deg)`. We need to add scale to the flip:

```scss
// Current (line 87-94)
.card {
  transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.flipped {
    transform: rotateY(180deg) scale(1.06);
  }
}

// New — add scale pulse
.card {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);

  &.flipped {
    transform: rotateY(180deg) scale(1);
  }
}
```

**Key insight:** The scale pulse is achieved through a **CSS keyframe animation** that runs during the flip. We cannot use a simple transition because we need the scale to increase mid-animation and then decrease — not just go from A to B.

### CSS Keyframe Animation for Scale Pulse

```scss
// Add to prediction.scss
@keyframes card-lift-pulse {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  40% {
    transform: rotateY(72deg) scale(1.07);
  }
  70% {
    transform: rotateY(144deg) scale(1.07);
  }
  100% {
    transform: rotateY(180deg) scale(1);
  }
}

.card.flipped {
  animation: card-lift-pulse 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  // Remove the transition-based flip — animation handles it
}
```

**Timing breakdown:**
- `0%` → `40%` (0–240ms): Card rotates to 72deg, scale grows to 1.07 — the "lifting" phase
- `40%` → `70%` (240–420ms): Card rotates from 72deg to 144deg, scale holds at 1.07 — the "holding near eyes" phase
- `70%` → `100%` (420–600ms): Card rotates to 180deg, scale returns to 1.0 — the "setting down" phase

### Important: Animation vs Transition

Since we're using `animation` instead of `transition`, we need to handle the **reverse** case (if the card flips back). However, in the current implementation, the card only flips one way (back → face). The inner flip (image ↔ prediction) is handled separately by `.card-inner`.

**For the outer card flip**, we replace the CSS `transition` with an `animation` that runs when `.flipped` class is added.

**For the reverse** (if user draws a new card and `showCardFace` goes from `true` → `false`), we need a separate animation:

```scss
@keyframes card-lift-pulse-reverse {
  0% {
    transform: rotateY(180deg) scale(1);
  }
  100% {
    transform: rotateY(0deg) scale(1);
  }
}

.card:not(.flipped) {
  animation: card-lift-pulse-reverse 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

**But wait** — the card starts with `showCardFace = false` (not flipped), so the reverse animation would run on page load. We need to control this carefully.

**Better approach:** Use a CSS class `is-flipping` that gets added by the component when `flipCard()` is called, and removed after the animation completes. This avoids unwanted animations on page load.

### Recommended Approach: JavaScript-controlled animation

**File:** [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts:110)

Add a property to track animation state:

```typescript
isAnimating = false;
```

Modify `flipCard()`:

```typescript
flipCard(): void {
  if (this.isAnimating) return; // Prevent double-clicks during animation
  
  if (!this.showCardFace) {
    if (this.attemptsRemaining > 0) {
      const used = this.attemptService.useAttempt();
      if (used) {
        this.isAnimating = true;
        this.updateAttempts();
        this.addCurrentCardToCollection();
        this.showCardFace = true;
        this.showPrediction = false;
        if (this.card && this.prediction) {
          this.attemptService.markPredictionReceived(this.card, this.prediction.text, this.prediction.id);
        }
        // Reset animation lock after animation duration
        setTimeout(() => {
          this.isAnimating = false;
        }, 650); // slightly longer than 600ms animation
      }
    }
  } else {
    // Inner flip — no scale pulse needed
    this.showPrediction = !this.showPrediction;
  }
}
```

**File:** [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html:6)

Add animation class binding:

```html
<div class="card" 
     [class.flipped]="showCardFace" 
     [class.animating]="isAnimating">
```

**File:** [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:82)

```scss
.card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;

  // Default flip (no animation, just transition for normal state changes)
  &.flipped {
    transform: rotateY(180deg) scale(1);
  }

  // Animated flip with scale pulse
  &.animating.flipped {
    animation: card-lift-pulse 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
}

@keyframes card-lift-pulse {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  35% {
    transform: rotateY(63deg) scale(1.07);
  }
  65% {
    transform: rotateY(135deg) scale(1.07);
  }
  100% {
    transform: rotateY(180deg) scale(1);
  }
}
```

---

## 2. Effect: Правильная ось (Correct Flip Axis)

### Current State

The card already flips around the **Y axis** (`rotateY(180deg)`). This is correct:
- Horizontal flip (left-to-right)
- Text on the back reads naturally left-to-right after the flip
- Better for portrait images (male portraits)

### Verification

No changes needed. The current implementation already uses:
```scss
&.flipped {
  transform: rotateY(180deg);
}
```

This is correct. The user's request confirms this is the desired axis.

---

## 3. Effect: Игровой блик (Glossy Light Sweep) — Soft & Subtle

### Concept

At the **90-degree midpoint** of the flip (when the card is edge-on to the viewer), a **very soft** white light streak sweeps across the card surface — like a subtle gloss reflection on premium card stock. This should be **barely perceptible** — just enough to give the card a glossy, premium feel without being distracting.

### Key Design Decisions for Softness

| Parameter | Value | Why |
|-----------|-------|-----|
| Max opacity | `0.25` (was `0.6`) | Very subtle — like a real gloss reflection |
| Gradient width | `40%` of card (was `60%`) | Narrower streak = more focused, premium look |
| Gradient edges | `rgba(255,255,255,0)` at 20% and 80% | Softer falloff, no hard edges |
| Peak opacity window | Only ~100ms (45%–55% of animation) | Quick flash, not a lingering streak |
| Animation easing | Same `cubic-bezier(0.22, 1, 0.36, 1)` | Synchronized with card flip |

### CSS for Soft Light Sweep

**File:** [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

```scss
// Soft glossy light sweep — subtle, like premium card stock reflection
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0) 20%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0) 80%,
    transparent 100%
  );
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  border-radius: 20px;
  will-change: left, opacity;
}

// Light sweep animation — synchronized with card flip
@keyframes card-gloss-sweep {
  0% {
    left: -100%;
    opacity: 0;
  }
  30% {
    left: -100%;
    opacity: 0;
  }
  42% {
    left: -20%;
    opacity: 0;
  }
  48% {
    left: -10%;
    opacity: 0.25;
  }
  55% {
    left: 60%;
    opacity: 0.25;
  }
  62% {
    left: 80%;
    opacity: 0;
  }
  100% {
    left: 150%;
    opacity: 0;
  }
}

.card.animating.flipped::before {
  animation: card-gloss-sweep 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

**Timing breakdown:**
- `0%` → `30%` (0–180ms): Light is off-screen left, invisible — card is still mostly face-on
- `30%` → `42%` (180–252ms): Light begins moving on-screen but still invisible — card approaching 90°
- `42%` → `48%` (252–288ms): Light enters the card area, opacity ramps up to 0.25 — **card is near edge-on**
- `48%` → `55%` (288–330ms): Light sweeps across the card at peak opacity — **this is the 90° midpoint moment**
- `55%` → `62%` (330–372ms): Light exits, opacity drops to 0 — card past 90°
- `62%` → `100%` (372–600ms): Light is gone — card completes rotation

### Visual Result

```
Time: 0ms       180ms      252ms      288ms      330ms      372ms      600ms
      |          |          |          |          |          |          |
Card: [======] → [===] →   [==] →    [|]   →   [|]   →   [===] →   [======]
      Front     Turning    Almost     Edge-on    Edge-on    Turning    Back
Light: off       off      entering   ✨sweep✨   exiting    gone       gone
                                    
Opacity: 0       0        0→0.25     0.25       0.25→0     0          0
```

The light sweep is **soft and quick** — like a real gloss reflection on a premium card. It's barely noticeable but adds a tangible sense of quality.

---

## 4. Inner Flip (Image ↔ Prediction)

The inner flip (`.card-inner` flipping between `.card-front` and `.prediction-back`) does **not** need the scale pulse or light sweep. Those effects are only for the **outer** flip (back → face).

The inner flip keeps its current smooth transition:
```scss
.card-inner {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## Summary of All Changes

### File: [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

| Line | Change |
|------|--------|
| ~16 | Add `isAnimating = false` property |
| ~110 | Modify `flipCard()`: add `isAnimating` guard and set `isAnimating = true` during flip |
| ~120 | Add `setTimeout` to reset `isAnimating = false` after 650ms |

### File: [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

| Line | Change |
|------|--------|
| ~6 | Add `[class.animating]="isAnimating"` to `.card` element |

### File: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

| Line | Change |
|------|--------|
| ~87 | Keep `transition` on `.card` for normal state changes |
| ~92 | Add `.card.animating.flipped` with `animation: card-lift-pulse` |
| ~94 | Add `@keyframes card-lift-pulse` — scale 1 → 1.07 → 1 during flip |
| ~96 | Add `.card::before` — soft glossy light sweep pseudo-element (opacity 0.25 max) |
| ~97 | Add `@keyframes card-gloss-sweep` — subtle light streak across card at 90° |

---

## Animation Flow Diagram

```
User clicks card (back side)
         │
         ▼
┌─────────────────────────────────────────────┐
│  isAnimating = true                          │
│  showCardFace = true                         │
│                                              │
│  ┌─── Animation starts ──────────────────┐   │
│  │                                        │   │
│  │  0ms:   rotateY(0deg)   scale(1.0)    │   │
│  │         Light: off, opacity 0          │   │
│  │                                        │   │
│  │  180ms: rotateY(54deg)  scale(1.07)   │   │
│  │         Light: still hidden            │   │
│  │                                        │   │
│  │  252ms: rotateY(76deg)  scale(1.07)   │   │
│  │         Light: entering, op 0→0.25    │   │
│  │                                        │   │
│  │  288ms: rotateY(86deg)  scale(1.07)   │   │
│  │         Light: sweeping ✨             │   │
│  │                                        │   │
│  │  330ms: rotateY(99deg)  scale(1.07)   │   │
│  │         Light: exiting, op 0.25→0     │   │
│  │                                        │   │
│  │  372ms: rotateY(112deg) scale(1.07)   │   │
│  │         Light: gone                    │   │
│  │                                        │   │
│  │  600ms: rotateY(180deg) scale(1.0)    │   │
│  │         Light: gone                    │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  setTimeout → isAnimating = false (650ms)     │
└─────────────────────────────────────────────┘
         │
         ▼
  Card face visible (image + name)
  User can now click to see prediction (inner flip)
```

---

## Edge Cases

1. **Rapid double-click**: `isAnimating` guard prevents the flip from being triggered twice
2. **Page reload**: `initializeCardState()` sets `showCardFace = true` without animation — no scale pulse on page load
3. **Draw new card**: `showCardFace` goes from `true` → `false` — the CSS `transition` handles this smoothly without the scale animation
4. **Premium purchase**: Same as draw new card — resets to back side without animation
5. **Inner flip**: No scale pulse or light sweep — only the outer flip gets the premium effects
6. **Mobile**: The animation uses CSS transforms which are GPU-accelerated — smooth on mobile

---

## Verification Checklist

- [ ] First click (back → face): card lifts with scale 1→1.07→1, feels heavy
- [ ] Light sweep is **very subtle** (opacity 0.25 max) — barely perceptible, like real gloss
- [ ] Light sweep visible at ~300ms when card is edge-on
- [ ] No scale pulse on page load (card already flipped)
- [ ] No scale pulse on inner flip (image ↔ prediction)
- [ ] Rapid double-click doesn't break animation
- [ ] Draw new card: card resets smoothly without animation
- [ ] Animation is smooth on mobile (GPU-accelerated)
- [ ] Overall feel is iOS-premium, like a physical trading card
