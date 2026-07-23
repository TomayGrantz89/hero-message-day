# Prediction Page — Redesign Plan (Updated)

## Overview

Three changes to the prediction page:

1. **Card size**: Increase to 60vh
2. **Card face (image side)**: Remove black border, add a light gray bottom strip (like top-bar) with card name in dark gray
3. **Enlarged overlay**: Only shows prediction side — dark background, prediction text, and an iOS ✕ close button. No card image in enlarged view.

---

## Change 1: Card Size → 60vh

**File:** [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

- `.card-wrapper`: `width: calc(60vh * 2 / 3)`, `height: 60vh`
- Update all responsive breakpoints (768px, 480px, 360px, landscape) from `55vh` to `60vh`

---

## Change 2: Card Face (Image Side) — Redesign

**Current state:** The `.face` side has a dark background (`#222`) with a black border (`5px solid rgb(85, 85, 85)`). The card name is inside the card, below the image, on the dark background.

**New design:**
- Remove the black border from `.face`
- Remove the dark background from `.face`
- The card image fills the card area
- Below the image, attached directly to the card bottom, a **light gray strip** (like top-bar: `rgba(242, 242, 247, 0.94)`) with the **card name in dark gray** (`#3C3C43`)

### HTML changes ([`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html), lines 11-15)

```html
<!-- Face side (card image) -->
<div class="side face" *ngIf="showCardFace && !showPrediction" (click)="openEnlarged($event)">
  <div class="card-image" [style.backgroundImage]="'url(' + card?.imageUrl + ')'"></div>
  <div class="card-name-bar">
    <span class="card-name">{{ card?.name }}</span>
  </div>
</div>
```

### SCSS changes ([`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss), lines 118-138)

```scss
.face {
  background: transparent;
  transform: rotateY(180deg);
  border: none; // remove black border
  padding: 0; // remove padding so image fills the card
  justify-content: flex-start; // stack image on top, name bar below

  .card-image {
    width: 100%;
    height: calc(100% - 48px); // leave space for name bar
    background-color: #444;
    background-size: cover;
    background-position: center;
    border-radius: 20px 20px 0 0; // rounded only at top
    margin-bottom: 0;
  }

  .card-name-bar {
    width: 100%;
    height: 48px;
    background: rgba(242, 242, 247, 0.94);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 0 20px 20px; // rounded only at bottom

    .card-name {
      font-size: 1.4rem;
      color: #3C3C43; // dark gray
      font-weight: 600;
    }
  }
}
```

---

## Change 3: Enlarged Overlay — Prediction Only

**Current state:** Enlarged overlay shows a card with two sides (face with image, back with prediction) that you flip between, with black borders.

**New behavior:**
- Tapping the **prediction side** (or the face side) opens the enlarged overlay
- The enlarged overlay shows **only the prediction text** on a **dark background** (keep the current dark theme for prediction)
- **No card image** in the enlarged view
- **iOS-style ✕ close button** in the top-right corner
- Tap outside or ✕ to close

### HTML changes ([`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html), lines 43-58)

Replace the entire enlarged overlay block:

```html
<!-- Enlarged Prediction Overlay -->
<div class="enlarged-overlay" *ngIf="showEnlarged" (click)="closeEnlarged()">
  <div class="enlarged-content" (click)="$event.stopPropagation()">
    <!-- Close button (iOS style) -->
    <button class="close-button" (click)="closeEnlarged()">✕</button>
    
    <!-- Prediction text -->
    <div class="enlarged-prediction-text">
      <p>{{ prediction?.text }}</p>
    </div>
  </div>
</div>
```

### SCSS changes ([`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss))

Replace the entire `.enlarged-card-overlay` block (lines 246-349) and all its responsive variants (lines 652-746):

```scss
// Enlarged Prediction Overlay
.enlarged-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;

  .enlarged-content {
    cursor: default;
    width: 85vw;
    max-width: 400px;
    max-height: 70vh;
    padding: 40px 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .close-button {
      position: absolute;
      top: 0;
      right: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      font-size: 16px;
      color: #EDECF9;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
      -webkit-tap-highlight-color: transparent;
      line-height: 1;

      &:active {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .enlarged-prediction-text {
      width: 100%;
      overflow-y: auto;
      text-align: center;

      p {
        font-size: 1.6rem;
        line-height: 1.6;
        color: #EDECF9;
        margin: 0;
      }
    }
  }
}
```

Responsive variants:

```scss
@media (max-width: 480px) {
  .enlarged-overlay .enlarged-content {
    width: 90vw;
    padding: 32px 20px;

    .enlarged-prediction-text p {
      font-size: 1.4rem;
    }
  }
}

@media (max-width: 360px) {
  .enlarged-overlay .enlarged-content {
    padding: 28px 16px;

    .enlarged-prediction-text p {
      font-size: 1.2rem;
    }
  }
}
```

---

## Change 4: Component Logic Simplification

**File:** [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

- Remove `enlargedSide` property (line 25) — no longer needed
- Remove `flipEnlarged()` method (line 277) — no flip in enlarged view
- Simplify `openEnlarged()` — remove `this.enlargedSide = 'face'`
- Simplify `closeEnlarged()` — remove `this.enlargedSide = 'face'`

---

## Files to Modify

| File | Changes |
|------|---------|
| [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html) | Update face side HTML (card-name → card-name-bar); replace enlarged overlay with prediction-only + ✕ button |
| [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) | Update card size to 60vh; redesign `.face` (no border, light gray name strip); replace enlarged overlay styles |
| [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts) | Remove `enlargedSide`, `flipEnlarged()`, simplify `openEnlarged()` and `closeEnlarged()` |

---

## Visual Summary

### Card (image side) — before vs after
| Before | After |
|--------|-------|
| Dark background `#222` | Transparent background |
| Black border `5px solid #555` | No border |
| Card name inside on dark bg | Light gray strip at bottom with dark gray name |

### Enlarged overlay — before vs after
| Before | After |
|--------|-------|
| Shows card with two flippable sides | Shows only prediction text |
| Card image visible on face side | No card image |
| Black borders | Clean, no borders |
| No close button | ✕ close button top-right |
| Flip to see prediction | Prediction always visible |
