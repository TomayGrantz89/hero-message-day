# Fix: Rectangular Background on Card Click in Collection Page

## Problem

When tapping a card on the collection page, a rectangular gray/blue highlight appears momentarily. This is the browser's default tap highlight.

## Root Cause

The `.card-item` elements in both the mobile swipe carousel and desktop grid have `cursor: pointer` but are **missing** `-webkit-tap-highlight-color: transparent`. Other pages in the app already set this property.

## Fix

Add `-webkit-tap-highlight-color: transparent` to all `.card-item` rules in `collection.scss`:

1. **`.swipe-page .card-item`** (line 44) — mobile carousel cards
2. **`.grid .card-item`** (line 214) — desktop grid cards

## File to Modify

- `src/app/pages/collection/collection.scss`
