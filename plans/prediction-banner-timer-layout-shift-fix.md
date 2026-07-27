# Plan: Fix Banner/Timer Layout Shift on Prediction Page

## Problem

When the action area switches between the instruction banner (states 1 & 2) and the timer block (state 3), the layout jumps. The card below moves up/down because the two elements have different total heights.

## Root Cause

The `.instruction-banner` and `.timer-block` have different total heights (min-height + vertical padding), causing the `.action-area` to change height when they swap via `*ngIf`.

### Height Comparison at Each Breakpoint

| Breakpoint | `.action-area` min-height | `.instruction-banner` total | `.timer-block` total | Jump |
|------------|--------------------------|----------------------------|---------------------|------|
| Base (>768px) | 72px | 56px + 32px = **88px** | 56px + 16px = **72px** | **16px** |
| ≤768px | 64px | 52px + 28px = **80px** | 52px + 12px = **64px** | **16px** |
| ≤480px | 62px | 50px + 24px = **74px** | 50px + 12px = **62px** | **12px** |
| ≤360px | 54px | 46px + 20px = **66px** | 46px + 8px = **54px** | **12px** |

The instruction banner has more padding (e.g., 16px top + 16px bottom = 32px) than the timer block (e.g., 8px top + 8px bottom = 16px), making it taller.

## Solution

Two options to fix this:

### Option A (Recommended): Equalize heights by adjusting padding

Make `.instruction-banner` and `.timer-block` have the **same total height** at each breakpoint. The simplest approach is to reduce the instruction banner's padding to match the timer block's padding, since the timer block's padding is more compact.

### Option B: Let `.action-area` `min-height` match the taller element

Increase `.action-area` `min-height` to match the instruction banner's total height (88px base). This reserves enough space for the taller element, so when the shorter timer appears, the container doesn't shrink.

**I recommend Option A** because it keeps the layout tighter and doesn't waste vertical space.

### Option A — Detailed Changes

#### 1. Base styles (>768px) — [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss:229)

Change `.instruction-banner` padding from `16px 24px` to `8px 24px`:

```scss
.instruction-banner {
  padding: 8px 24px;   /* was: 16px 24px */
  min-height: 56px;    /* keep */
}
```

New total: 56px + 16px = **72px** — matches `.timer-block` (72px) and `.action-area` `min-height` (72px).

#### 2. ≤768px — [`src/app/pages/prediction/prediction.scss:379`](src/app/pages/prediction/prediction.scss:379)

Change `.instruction-banner` padding from `14px 20px` to `6px 20px`:

```scss
.instruction-banner {
  padding: 6px 20px;   /* was: 14px 20px */
  min-height: 52px;    /* keep */
}
```

New total: 52px + 12px = **64px** — matches `.timer-block` (64px) and `.action-area` `min-height` (64px).

#### 3. ≤480px — [`src/app/pages/prediction/prediction.scss:469`](src/app/pages/prediction/prediction.scss:469)

Change `.instruction-banner` padding from `12px 16px` to `6px 16px`:

```scss
.instruction-banner {
  padding: 6px 16px;   /* was: 12px 16px */
  min-height: 50px;    /* keep */
}
```

New total: 50px + 12px = **62px** — matches `.timer-block` (62px) and `.action-area` `min-height` (62px).

#### 4. ≤360px — [`src/app/pages/prediction/prediction.scss:524`](src/app/pages/prediction/prediction.scss:524)

Change `.instruction-banner` padding from `10px 14px` to `4px 14px`:

```scss
.instruction-banner {
  padding: 4px 14px;   /* was: 10px 14px */
  min-height: 46px;    /* keep */
}
```

New total: 46px + 8px = **54px** — matches `.timer-block` (54px) and `.action-area` `min-height` (54px).

### Height Comparison After Fix

| Breakpoint | `.action-area` min-height | `.instruction-banner` total | `.timer-block` total | Jump |
|------------|--------------------------|----------------------------|---------------------|------|
| Base (>768px) | 72px | 56px + 16px = **72px** | 56px + 16px = **72px** | **0px ✅** |
| ≤768px | 64px | 52px + 12px = **64px** | 52px + 12px = **64px** | **0px ✅** |
| ≤480px | 62px | 50px + 12px = **62px** | 50px + 12px = **62px** | **0px ✅** |
| ≤360px | 54px | 46px + 8px = **54px** | 46px + 8px = **54px** | **0px ✅** |

## Visual Result

```
Before fix:
┌──────────────────────────────┐
│      .action-area            │
│  ┌────────────────────────┐  │
│  │  instruction-banner    │  │  ← 88px tall
│  │  (padding: 16px 24px)  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│      .card-wrapper           │  ← positioned here
└──────────────────────────────┘

  ↓ User reveals prediction → banner → timer ↓

┌──────────────────────────────┐
│      .action-area            │
│  ┌────────────────────────┐  │
│  │     timer-block        │  │  ← 72px tall — SHRINKS!
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│      .card-wrapper           │  ← JUMPS UP by 16px!
└──────────────────────────────┘


After fix:
┌──────────────────────────────┐
│      .action-area            │
│  ┌────────────────────────┐  │
│  │  instruction-banner    │  │  ← 72px tall
│  │  (padding: 8px 24px)   │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│      .card-wrapper           │  ← stable position
└──────────────────────────────┘

  ↓ User reveals prediction → banner → timer ↓

┌──────────────────────────────┐
│      .action-area            │
│  ┌────────────────────────┐  │
│  │     timer-block        │  │  ← 72px tall — SAME!
│  └────────────────────────┘  │
└──────────────────────────────┘
┌──────────────────────────────┐
│      .card-wrapper           │  ← NO JUMP!
└──────────────────────────────┘
```

## Files Changed

| File | Change |
|------|--------|
| `src/app/pages/prediction/prediction.scss` | Reduce `.instruction-banner` vertical padding at all breakpoints to match `.timer-block` height |

## Edge Cases

1. **Text wrapping in banner:** If the instruction text wraps to two lines, the banner will grow taller than `min-height`. This is acceptable — the banner needs the extra space for readability. The timer block doesn't have this issue because its text is shorter. This is a pre-existing behavior and not affected by this change.

2. **Very small screens (≤360px):** The reduced padding (4px top/bottom) still provides enough visual spacing since `min-height: 46px` ensures the banner has adequate height.

3. **Landscape orientation:** The landscape breakpoints don't override `.instruction-banner` padding, so they inherit from the base or ≤768px styles. The fix at those breakpoints ensures consistency.
