# Plan: Fix Bottom Bar Tab Shifting on Click

## Problem Analysis

When a user clicks a tab in the bottom navigation bar, the active tab receives a background highlight via the `.nav-item.active` class. This class changes the `padding` from `4px 8px` to `4px 12px` (see [`bottom-bar.scss`](src/app/components/bottom-bar/bottom-bar.scss:30) and [`bottom-bar.scss`](src/app/components/bottom-bar/bottom-bar.scss:65)).

**The math:**
- Inactive tab: `padding: 4px 8px` → total horizontal padding = 16px
- Active tab: `padding: 4px 12px` → total horizontal padding = 24px
- **Difference: 8px wider** when active

Since the container uses `justify-content: space-around`, any change in one item's width causes all items to recalculate their positions, resulting in the visible "shifting" effect.

## Root Cause

The `.nav-item.active` selector overrides padding to create visual space for the background highlight (`background: rgba(0, 122, 255, 0.1)` with `border-radius: 12px`). This was added in a previous fix (see [`plans/top-bar-and-navigation-fix.md`](plans/top-bar-and-navigation-fix.md:79-98)) to provide a visual indicator of the active tab.

## Solution Options

### Option A: Fixed padding with `box-sizing: border-box` (Recommended)

Keep the same padding for both active and inactive states. Use `border-box` sizing so padding doesn't affect the element's total width.

**Changes to [`bottom-bar.scss`](src/app/components/bottom-bar/bottom-bar.scss):**

```scss
.nav-item {
  // ... existing styles ...
  padding: 4px 12px;  // Use the wider padding for ALL items
  box-sizing: border-box;
  // ...
}

.nav-item.active {
  background: rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  // Remove the padding override — keep same as inactive
  // padding: 4px 12px;  // Same as base — no change needed
}
```

**Pros:**
- Simplest fix — minimal CSS change
- All tabs have identical dimensions regardless of state
- No layout recalculation on click

**Cons:**
- Slightly more horizontal space used by inactive tabs (minor)

---

### Option B: Use `outline` or `box-shadow` instead of `background`

Avoid changing padding entirely. Use a visual indicator that doesn't affect layout:

```scss
.nav-item.active {
  // Instead of background + padding change, use box-shadow
  box-shadow: inset 0 0 0 4px rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  // Keep padding identical to inactive
}
```

**Pros:**
- Zero layout impact — no dimension changes
- Visual effect is contained within the element

**Cons:**
- `box-shadow` may not look exactly like a background fill
- Slightly more complex CSS

---

### Option C: Use `transform` for the visual effect

Apply the background via a pseudo-element that doesn't affect layout:

```scss
.nav-item {
  position: relative;
  padding: 4px 8px;  // Keep original padding
  // ...
}

.nav-item.active::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 12px;
  // Pseudo-elements don't affect layout
}
```

**Pros:**
- Zero layout impact
- Original padding preserved
- Clean separation of visual and layout concerns

**Cons:**
- Requires adding `position: relative` to `.nav-item`
- Slightly more CSS code

---

### Option D: Use `flex: 1` with equal distribution

Give each nav item an equal `flex` value so they all occupy the same space regardless of padding:

```scss
.nav-item {
  flex: 1;
  padding: 4px 8px;
  // ...
}

.nav-item.active {
  padding: 4px 12px;  // Can keep the wider padding
  // flex: 1 ensures the item doesn't grow beyond its share
}
```

**Pros:**
- Tabs remain equally distributed
- Active tab can have different padding

**Cons:**
- `flex: 1` may cause tabs to stretch/compress differently on various screen sizes
- Less predictable behavior with `space-around`

---

## Recommended Solution: Option A

**Option A** is the simplest and most maintainable. By unifying the padding to `4px 12px` for all tabs (both active and inactive), the dimensions never change, and no layout recalculation occurs on click. The 4px extra padding on inactive tabs is negligible and visually consistent.

## Implementation Steps

### Step 1: Update [`bottom-bar.scss`](src/app/components/bottom-bar/bottom-bar.scss)

1. Change base `.nav-item` padding from `4px 8px` to `4px 12px` (line 30)
2. Remove the `padding: 4px 12px` override from `.nav-item.active` (line 65) — it will inherit the base padding
3. Add `box-sizing: border-box` to `.nav-item` for safety

### Step 2: Verify

1. Build the project and check that tabs no longer shift on click
2. Verify the active highlight still looks correct
3. Test on different screen sizes (responsive breakpoints)

## Files to Modify

| File | Change |
|------|--------|
| [`src/app/components/bottom-bar/bottom-bar.scss`](src/app/components/bottom-bar/bottom-bar.scss) | Unify padding, add `box-sizing: border-box` |

## Visual Comparison

```
Before (shifting):
┌──────┬──────────┬──────┬──────┐
│ Tab1 │  Tab2    │ Tab3 │ Tab4 │  ← Tab2 active, wider padding
└──────┴──────────┴──────┴──────┘

After (stable):
┌──────┬──────┬──────┬──────┐
│ Tab1 │ Tab2 │ Tab3 │ Tab4 │  ← All tabs same padding
└──────┴──────┴──────┴──────┘
