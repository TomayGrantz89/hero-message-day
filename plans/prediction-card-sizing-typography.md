# Prediction Page: Card Sizing, Positioning & Typography

## Changes Required

1. **Card size**: Make card occupy ~55% of screen height while preserving 2:3 aspect ratio
2. **Card position**: Shift card a few pixels down vertically
3. **Typography**: Increase all explanatory text font sizes by 1px, make colors darker
4. **Card name**: Leave unchanged

---

## 1. Card Size — 55% of Screen Height with 2:3 Aspect Ratio

### Current (prediction.scss:73-78)

```scss
.card-wrapper {
  perspective: 1000px;
  width: 300px;
  height: 450px;   // fixed pixel height
  margin: 10px auto;
  cursor: pointer;
```

### Change to

Use `vh` units for height (55vh) and calculate width from aspect ratio (2:3 → width = height * 2/3):

```scss
.card-wrapper {
  perspective: 1000px;
  width: calc(55vh * 2 / 3);  // 2:3 aspect ratio based on 55vh height
  height: 55vh;
  max-width: 90vw;            // prevent overflow on narrow screens
  max-height: 55vh;
  margin: 10px auto;
  cursor: pointer;
```

**Why this works**: The card maintains its 2:3 proportion. On a typical 800px viewport height, the card would be 440px tall × ~293px wide. On smaller screens, `max-width: 90vw` prevents horizontal overflow.

### Responsive breakpoints

For each media query, replace the fixed pixel values with the same `55vh` approach. The `55vh` will naturally scale down on smaller screens since viewport height is smaller.

**768px breakpoint** (current: 250×375):
```scss
.card-wrapper {
  width: calc(55vh * 2 / 3);
  height: 55vh;
  max-width: 90vw;
  margin: 8px auto;
```

**480px breakpoint** (current: 220×330):
```scss
.card-wrapper {
  width: calc(55vh * 2 / 3);
  height: 55vh;
  max-width: 90vw;
  margin: 6px auto;
```

**360px breakpoint** (current: 200×300):
```scss
.card-wrapper {
  width: calc(55vh * 2 / 3);
  height: 55vh;
  max-width: 90vw;
  margin: 4px auto;
```

**Landscape** — in landscape mode, 55vh may make the card too tall. Add a landscape override:
```scss
@media (max-width: 768px) and (orientation: landscape) {
  .card-wrapper {
    height: 65vh;        // taller in landscape since viewport height is limited
    width: calc(65vh * 2 / 3);
    max-width: 50vw;     // limit width in landscape
  }
}
```

---

## 2. Shift Card Down Vertically

Add a small `padding-top` to `.main` or a `translateY` to `.card-wrapper` to shift the card down a few pixels.

**Option**: Add `padding-top: 8px` to `.main` — this shifts the entire content block (subtitle + card + button) down slightly, which also helps with the visual centering.

```scss
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  padding-top: 8px;    // ADD THIS
}
```

---

## 3. Typography — Increase Font Sizes by 1px, Darker Colors

### Changes in prediction.scss

| Selector | Current | New |
|----------|---------|-----|
| `.subtitle` | `font-size: 1.2rem; color: #666;` | `font-size: 1.3rem; color: #444;` |
| `.button-section .btn-action` | `font-size: 1.2rem;` | `font-size: 1.3rem;` |
| `.button-section .attempts-counter` | `font-size: 1rem; color: #8E8E93;` | `font-size: 1.1rem; color: #666;` |
| `.timer-line` | `font-size: 1.1rem;` | `font-size: 1.2rem;` |
| `.expand-hint` | `font-size: 0.85rem;` | `font-size: 0.95rem;` |
| `.prediction-text p` | `font-size: 1.3rem;` | `font-size: 1.4rem;` |

### Card name — DO NOT CHANGE
`.card-name` stays at `font-size: 1.8rem;`

### Responsive breakpoints — same +1px adjustments

**768px:**
| Selector | Current | New |
|----------|---------|-----|
| `.subtitle` | `font-size: 1.1rem;` | `font-size: 1.2rem;` |
| `.btn-action` | `font-size: 1.1rem;` | `font-size: 1.2rem;` |
| `.attempts-counter` | `font-size: 0.95rem;` | `font-size: 1.05rem;` |
| `.timer-line` | `font-size: 1rem;` | `font-size: 1.1rem;` |

**480px:**
| Selector | Current | New |
|----------|---------|-----|
| `.subtitle` | `font-size: 1rem;` | `font-size: 1.1rem;` |
| `.btn-action` | `font-size: 1.1rem;` | `font-size: 1.2rem;` |
| `.attempts-counter` | `font-size: 0.9rem;` | `font-size: 1rem;` |
| `.timer-line` | `font-size: 0.95rem;` | `font-size: 1.05rem;` |

---

## Files to Change

| File | Changes |
|------|---------|
| `src/app/pages/prediction/prediction.scss` | Card wrapper: use `55vh` height with `calc(55vh * 2 / 3)` width |
| `src/app/pages/prediction/prediction.scss` | `.main`: add `padding-top: 8px` |
| `src/app/pages/prediction/prediction.scss` | All explanatory text: font-size +1px, darker colors |
| `src/app/pages/prediction/prediction.scss` | All responsive breakpoints: same adjustments |
| `src/app/pages/prediction/prediction.scss` | Landscape: adjust card height to 65vh with width limit |

## What NOT to Change

- `.card-name` font-size (keep at 1.8rem / 1.5rem on mobile)
- Card aspect ratio (preserve 2:3)
- Button colors, padding, border-radius
- Enlarged card overlay styles
