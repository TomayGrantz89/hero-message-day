# Fix: Rectangular Background on Card Click in Prediction Page

## Problem

When clicking the card on the prediction page, a rectangular background/substrate appears momentarily. This is caused by **two issues** working together:

### Issue 1: Missing `-webkit-tap-highlight-color`

The prediction page's card elements do **not** have `-webkit-tap-highlight-color: transparent`. On mobile browsers (Chrome, Safari, WebView), tapping a clickable element produces a default gray/blue rectangular highlight overlay. Other pages/components in the app (bottom-bar, welcome, collection, terms-modal) already set this property, but the prediction card is missing it.

**Affected elements:**
- `.card-wrapper` — has `cursor: pointer` and `(click)` handler
- `.card` — the inner card container

### Issue 2: `.face-prediction-layer` dark background visible during transitions

The `.face-prediction-layer` (prediction text layer) has:
```scss
background: var(--prediction-bg, #2A2A2E);
```

This dark background (#2A2A2E) is present on an element that is absolutely positioned inside `.face`. Even though the layer has `opacity: 0` and `pointer-events: none` when hidden, during the CSS opacity transition (0.5s ease), there can be a brief moment where this dark rectangle is partially visible — especially on slower devices or when the browser compositor is under load.

Additionally, the `.face` side itself has `border: 5px solid transparent` which, combined with the dark prediction layer background, can create a visible rectangular outline.

## Solution

### Fix 1: Add `-webkit-tap-highlight-color: transparent`

Add to `.card-wrapper` and `.card` in `prediction.scss`:

```scss
.card-wrapper {
  -webkit-tap-highlight-color: transparent;
  
  .card {
    -webkit-tap-highlight-color: transparent;
    // ...
  }
}
```

### Fix 2: Ensure `.face-prediction-layer` background is hidden when not visible

The `.face-prediction-layer` already has `opacity: 0` and `pointer-events: none` when hidden, but we should also ensure its background doesn't show through during transitions. Add `visibility: hidden` alongside `opacity: 0` for the hidden state, and `visibility: visible` for the visible state. This ensures the browser doesn't render the layer at all when hidden.

```scss
.face-prediction-layer {
  // ... existing styles
  opacity: 0;
  pointer-events: none;
  visibility: hidden;        // ADD
  transition: opacity 0.5s ease, visibility 0.5s ease;  // UPDATE

  &.visible {
    opacity: 1;
    pointer-events: auto;
    visibility: visible;     // ADD
  }
}
```

### Fix 3: Remove transparent border from `.face` side

The `border: 5px solid transparent` on `.face` creates a 5px invisible border that can still affect layout and potentially show as a subtle outline. Since `.face` uses `border-radius: 20px` and is absolutely positioned to fill the card, this border is unnecessary.

```scss
.face {
  background: transparent;
  // border: 5px solid transparent;  // REMOVE
  padding: 0;
  // ...
}
```

## Files to Modify

1. **`src/app/pages/prediction/prediction.scss`** — all three CSS fixes above

## Testing

1. Open the prediction page on a mobile device or Chrome DevTools mobile emulation
2. Tap the card (back side) — verify no rectangular highlight appears
3. Tap the card again (face image → prediction) — verify no rectangular flash
4. Verify the card still flips correctly with smooth transitions
5. Test on both iOS Safari and Android Chrome if possible
