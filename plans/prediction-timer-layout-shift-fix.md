# Plan: Fix Timer Banner Layout Shift on Prediction Page

## Problem

When the user opens a card on the prediction page, the timer block (`.timer-block`) appears and pushes the card down, causing the entire layout to jump. This happens because:

1. The `.timer-block` uses `*ngIf="showTimer"` — when `showTimer` is `false`, the timer is completely removed from the DOM
2. The `.action-area` container has **no `min-height`** — it collapses to zero height when the timer is hidden
3. When the timer appears, `.action-area` suddenly gains height, pushing `.card-wrapper` downward

## Root Cause

In [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss:220), the `.action-area` has:

```scss
.action-area {
  margin-top: 0;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  justify-content: flex-start;
  /* NO min-height — container collapses when timer is hidden */
}
```

The original plan (`prediction-button-timer-unified.md`) correctly specified `min-height: 140px` on `.action-area`, but this was later removed by the `prediction-action-area-fixed-gap.md` plan which replaced `min-height` with `margin-bottom: 80px`. The current code has `margin-bottom: 30px` and no `min-height`.

## Solution

Add a `min-height` to `.action-area` that matches the height of the `.timer-block` (including its padding). This reserves vertical space even when the timer is hidden, preventing layout shift.

### Timer Block Height Calculation

| Breakpoint | Timer `min-height` | Padding (top + bottom) | Total reserved height |
|------------|-------------------|----------------------|---------------------|
| Base (>768px) | 56px | 8px + 8px = 16px | **72px** |
| ≤768px | 52px | 6px + 6px = 12px | **64px** |
| ≤480px | 50px | 6px + 6px = 12px | **62px** |
| ≤360px | 46px | 4px + 4px = 8px | **54px** |

### Changes

#### 1. [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss) — Base styles (line ~220)

Add `min-height: 72px` to `.action-area`:

```scss
.action-area {
  margin-top: 0;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  min-height: 72px;        /* ← ADD: reserves space for timer block */
  justify-content: flex-start;
```

#### 2. [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss) — `@media (max-width: 768px)` (line ~351)

Add `min-height: 64px`:

```scss
.action-area {
  margin-top: 0;
  margin-bottom: 30px;
  max-width: 280px;
  min-height: 64px;        /* ← ADD */
```

#### 3. [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss) — `@media (max-width: 480px)` (line ~430)

Add `min-height: 62px`:

```scss
.action-area {
  margin-top: 0;
  margin-bottom: 3ch;
  max-width: 260px;
  min-height: 62px;        /* ← ADD */
```

#### 4. [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss) — `@media (max-width: 360px)` (line ~478)

Add `min-height: 54px`:

```scss
.action-area {
  min-height: 54px;        /* ← ADD */
```

#### 5. [`src/app/pages/prediction/prediction.scss`](../src/app/pages/prediction/prediction.scss) — Landscape `@media (max-width: 768px) and (orientation: landscape)` (line ~527)

Add `min-height: 72px` (same as base):

```scss
.action-area {
  margin-top: 0;
  margin-bottom: 30px;
  min-height: 72px;        /* ← ADD */
```

### HTML — No changes needed

The `*ngIf="showTimer"` on `.timer-block` can stay as-is. The `.action-area` container will maintain its minimum height regardless of whether the timer is rendered.

## Visual Result

```
Before fix:
┌──────────────────────────────┐
│         .action-area         │  ← height = 0 (collapsed)
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│         .card-wrapper        │  ← positioned here
│                              │
│                              │
└──────────────────────────────┘

  ↓ User flips card → timer appears ↓

┌──────────────────────────────┐
│         .action-area         │
│  ┌────────────────────────┐  │
│  │     timer-block        │  │  ← pushes card down!
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│         .card-wrapper        │  ← jumped down
│                              │
└──────────────────────────────┘


After fix:
┌──────────────────────────────┐
│         .action-area         │
│  min-height: 72px reserved   │  ← space always reserved
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│         .card-wrapper        │  ← stable position
│                              │
└──────────────────────────────┘

  ↓ User flips card → timer appears ↓

┌──────────────────────────────┐
│         .action-area         │
│  ┌────────────────────────┐  │
│  │     timer-block        │  │  ← no layout shift!
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│         .card-wrapper        │  ← same position
│                              │
└──────────────────────────────┘
```

## Files Changed

| File | Change |
|------|--------|
| `src/app/pages/prediction/prediction.scss` | Add `min-height` to `.action-area` at all breakpoints |
