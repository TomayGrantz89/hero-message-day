# Oracle Page — Image Position & Button Width Fix

## Problem

On the oracle (question) page, the character image (`cold.png`) uses `object-fit: cover` and fills the entire viewport via `position: absolute` in `.character-section`. This causes the image to overlap the instruction banner text at the top of the page.

## Changes Required

### 1. Shift character image **down** (so it doesn't overlap text)

**File:** `src/app/pages/question/question.scss`

**What:** Change `object-position` on `.character-image` from `center center` to `center bottom`.

**Why:** The image currently centers vertically, which means the character's head/top portion sits at the top of the viewport, overlapping the instruction banner. By anchoring to `bottom`, the image's bottom edge aligns with the bottom of the container, pushing the visible portion downward — the character's upper body/head moves below the banner area.

**Change:**
```scss
// Before
object-position: center center;

// After
object-position: center bottom;
```

### 2. Shift character image slightly **to the right**

**File:** `src/app/pages/question/question.scss`

**What:** Change `object-position` from `center bottom` to `70% bottom`.

**Why:** The user wants the character shifted slightly to the right. `70%` moves the focal point 70% from the left edge (i.e., 30% from the right), effectively shifting the visible crop rightward.

**Change:**
```scss
// Before
object-position: center bottom;

// After
object-position: 70% bottom;
```

> **Note:** Steps 1 and 2 can be combined into a single change: `object-position: 70% bottom;`

### 3. Make the "Спросить" button slightly wider/longer

**File:** `src/app/pages/question/question.scss`

**What:** Increase `min-width` and horizontal `padding` on `.ask-button` across all breakpoints.

**Current values → New values:**

| Breakpoint | Property | Before | After |
|---|---|---|---|
| Base (default) | `min-width` | `120px` | `160px` |
| Base (default) | `padding` | `14px 28px` | `14px 36px` |
| `max-width: 768px` | `min-width` | `100px` | `140px` |
| `max-width: 768px` | `padding` | `12px 24px` | `12px 32px` |
| `max-width: 480px` | `min-width` | `90px` | `130px` |
| `max-width: 480px` | `padding` | `10px 20px` | `10px 28px` |

### 4. Responsiveness preserved

All changes are purely CSS `object-position` and button sizing adjustments. No layout structure changes, no DOM modifications, no breakpoint removals. The existing `@media` queries continue to work as before.

## Files to Modify

| File | Changes |
|---|---|
| `src/app/pages/question/question.scss` | Lines 71, 92-93, 146-147, 177-178 |

## Summary of CSS Changes

```scss
// Line 71 — image position
.character-image {
  // ...
  object-position: 70% bottom;  // was: center center
}

// Line 92-93 — button sizing (base)
.ask-button {
  min-width: 160px;   // was: 120px
  padding: 14px 36px; // was: 14px 28px
}

// Line 146-147 — button sizing (768px)
.ask-button {
  min-width: 140px;   // was: 100px
  padding: 12px 32px; // was: 12px 24px
}

// Line 177-178 — button sizing (480px)
.ask-button {
  min-width: 130px;   // was: 90px
  padding: 10px 28px; // was: 10px 20px
}
