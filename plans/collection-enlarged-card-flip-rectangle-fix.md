# Fix: Transparent Rectangular Overlay on Enlarged Card Flip in Collection

## Problem

When viewing an enlarged card in the collection detail overlay and tapping it to flip to the back side (to read the story/history), a semi-transparent or transparent rectangular overlay appears momentarily on the card.

## Root Cause

The `.enlarged-card` element (and its child faces) have `cursor: pointer` but are **missing** `-webkit-tap-highlight-color: transparent`. On mobile browsers (Chrome for Android, Safari iOS), tapping an element with a click handler triggers the browser's default tap highlight — a semi-transparent rectangular overlay that appears momentarily.

The existing fix in `collection-card-click-rectangle-fix.md` only addressed the grid/swipe `.card-item` elements, but did **not** cover the enlarged card detail view elements.

## Elements Affected

The following elements in the enlarged card overlay (lines 306-415 of `collection.scss`) need `-webkit-tap-highlight-color: transparent`:

1. **`.enlarged-card`** (line 322) — the main card container with `cursor: pointer` and `(click)="flipDetail()"`
2. **`.enlarged-card-face`** (line 360) — the front face of the card
3. **`.enlarged-card-back`** (line 376) — the back face of the card

## Additional Consideration

The `.enlarged-card-overlay` (line 306) has `cursor: pointer` because clicking it calls `closeDetail()`. It should also get `-webkit-tap-highlight-color: transparent` to prevent a highlight when closing the detail view.

## Fix

Add `-webkit-tap-highlight-color: transparent` to the following selectors in `src/app/pages/collection/collection.scss`:

| # | Selector | Line | Reason |
|---|----------|------|--------|
| 1 | `.enlarged-card-overlay` | 306 | Has `cursor: pointer` + `(click)="closeDetail()"` |
| 2 | `.enlarged-card` | 322 | Has `cursor: pointer` + `(click)="flipDetail()"` |
| 3 | `.enlarged-card-face` | 360 | Child of `.enlarged-card`, participates in tap |
| 4 | `.enlarged-card-back` | 376 | Child of `.enlarged-card`, participates in tap |

## File to Modify

- `src/app/pages/collection/collection.scss`

## Testing

1. Open the collection page on a mobile device or Chrome DevTools mobile emulation
2. Tap an owned card to open the enlarged detail view
3. Tap the enlarged card to flip it to the back side
4. Verify no rectangular overlay appears during the flip
5. Tap the dark overlay background to close — verify no highlight
