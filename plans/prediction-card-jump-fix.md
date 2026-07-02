# Fix: Card Jumping Up During Fade Animation on Prediction Page

## Problem

When clicking the card on the prediction page, the card "jumps" upward during the fade animation. This happens in two scenarios:

1. **First click** (back → face): The card back fades out and the face fades in — the card jumps up.
2. **Second click** (face image → prediction text): The image layer fades out and the prediction layer fades in — the card jumps up again.

## Root Causes

### Cause 1: Border mismatch between `.back` and `.face`

File: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:105)

The `.back` side has `border: 5px solid #555` (line 110), while the `.face` side has `border: none` (line 121). When the back fades out and the face fades in, the 5px border disappears, causing the card content to effectively shift by 5px in all directions. This changes the visual center of the card, making it appear to jump upward.

### Cause 2: Subtitle text becomes empty string

File: [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html:3)

```html
<p class="subtitle">{{ showCardFace ? (showPrediction ? '' : 'Нажмите на карту, чтобы узнать предсказание') : 'Нажмите на карту, чтобы открыть её' }}</p>
```

When `showPrediction` is `true`, the subtitle becomes an empty string `''`. The `<p>` element still exists in the DOM with its `margin-bottom: 20px`, so the space is still reserved. However, the text line-height collapses, which can cause the surrounding layout to shift slightly. More importantly, the **button section** below the card is conditionally shown/hidden via `*ngIf="showButton"`, and `showButton` returns `!showCardFace` — meaning when the card face is shown, the button section disappears entirely. This removal of the button section causes the remaining content (the card) to re-center vertically in the flex container, making it appear to jump up.

### Cause 3: Button section disappears when card face is shown

File: [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts:144)

```typescript
get showButton(): boolean {
    return !this.showCardFace;
}
```

When `showCardFace` becomes `true`, `showButton` returns `false`, and the entire `.button-section` (with the action button and attempts counter) is removed from the DOM via `*ngIf`. This removes a block of content that was pushing the card up from below. Since `.main` uses `justify-content: center`, the card re-centers vertically, causing the upward jump.

### Cause 4: `.face` starts with `opacity: 0` but is still in the layout flow

File: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:119)

The `.face` side has `opacity: 0; pointer-events: none` initially, but it's still `position: absolute` within the card, so it shouldn't affect layout. However, the `.back` side transitioning from `opacity: 1` to `opacity: 0` while the border disappears creates a visual shift.

## Solution

### Fix 1: Add border to `.face` to match `.back`

Add `border: 5px solid transparent` to `.face` so the border space is preserved during the transition. This prevents the visual shift when the back's border disappears.

**File**: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:119)

```scss
.face {
    background: transparent;
    border: 5px solid transparent;  // ADD THIS — preserves border space
    padding: 0;
    justify-content: flex-start;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    ...
}
```

### Fix 2: Keep subtitle text always visible

Change the subtitle logic so it never becomes empty. Show appropriate text for each state:

- **Back side visible**: "Нажмите на карту, чтобы открыть её"
- **Face visible, prediction hidden**: "Нажмите на карту, чтобы узнать предсказание"
- **Prediction visible**: "Нажмите на карту, чтобы увидеть изображение" (or similar)

**File**: [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html:3)

```html
<p class="subtitle">
    {{ !showCardFace ? 'Нажмите на карту, чтобы открыть её' : 
       showPrediction ? 'Нажмите на карту, чтобы увидеть изображение' : 
       'Нажмите на карту, чтобы узнать предсказание' }}
</p>
```

### Fix 3: Keep button section in the DOM but hide it with opacity

Instead of using `*ngIf` to remove the button section, use a class-based hide with `opacity: 0` and `pointer-events: none` so the space is preserved and the card doesn't re-center.

**File**: [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html:30)

```html
<div class="button-section" [class.hidden]="!showButton">
    <button class="btn-action" (click)="onActionButtonClick()">
        {{ buttonText }}
    </button>
    <div class="attempts-counter">
        Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
    </div>
</div>
```

**File**: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:220)

```scss
.button-section {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 320px;
    transition: opacity 0.3s ease;

    &.hidden {
        opacity: 0;
        pointer-events: none;
    }
    ...
}
```

### Fix 4: Ensure `.main` doesn't re-center content dynamically

Add `min-height` to `.main` to prevent layout shifts when content changes. Also, since the button section will now stay in the DOM (just hidden), the card won't re-center.

**File**: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:51)

```scss
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding-top: 8px;
    // Add min-height to prevent layout shifts
    min-height: calc(100vh - 140px); // adjust based on container padding
    ...
}
```

## Changes Summary

| File | Change | Reason |
|------|--------|--------|
| `src/app/pages/prediction/prediction.scss` | Add `border: 5px solid transparent` to `.face` | Prevent visual shift when back's border disappears |
| `src/app/pages/prediction/prediction.html` | Change subtitle to never be empty | Prevent layout shift from collapsing text |
| `src/app/pages/prediction/prediction.html` | Change `*ngIf="showButton"` → `[class.hidden]="!showButton"` | Keep button section in DOM to preserve vertical space |
| `src/app/pages/prediction/prediction.scss` | Add `.button-section.hidden` styles with `opacity: 0` | Hide button section visually without removing from layout |
| `src/app/pages/prediction/prediction.scss` | Add `min-height` to `.main` | Prevent flex re-centering when content changes |

## Verification

1. Click card from back → face: card should not jump
2. Click card from face image → prediction text: card should not jump
3. Subtitle text should always show meaningful text, never empty
4. Button section should fade out gracefully when card face is shown
5. Timer line should still appear correctly when attempts are exhausted
