# Plan: Restrict Click on Available (Card Back) Cards in Collection

## Problem

On the collection page, cards in the **available** state (not yet obtained by the user, showing card back) are clickable. Clicking them opens the enlarged card detail view, which displays the card image face-up. This lets users see card artwork before they've actually obtained the card through a prediction.

## Current Behavior

| Card State | Clickable? | Result |
|------------|-----------|--------|
| `owned` | ✅ Yes | Opens enlarged card detail (face image + story on flip) |
| `available` | ✅ Yes | Opens enlarged card detail (face image) — **BUG** |
| `locked` | ❌ No | Nothing (lock icon shows premium message) |

## Desired Behavior

| Card State | Clickable? | Result |
|------------|-----------|--------|
| `owned` | ✅ Yes | Opens enlarged card detail (face image + story on flip) |
| `available` | ❌ No | Nothing — card back is just a visual placeholder |
| `locked` | ❌ No | Nothing (lock icon shows premium message) |

## Required Changes

### 1. `src/app/pages/collection/collection.ts` — Update `selectCard()` method

**Current code (line 194-201):**
```typescript
selectCard(item: CollectionCard): void {
    if (item.state === 'locked') {
        return; // Cannot open locked cards
    }
    this.selectedCard = item.card;
    this.showDetail = true;
    this.detailSide = 'face';
}
```

**New code:**
```typescript
selectCard(item: CollectionCard): void {
    if (item.state !== 'owned') {
        return; // Only owned cards can be opened
    }
    this.selectedCard = item.card;
    this.showDetail = true;
    this.detailSide = 'face';
}
```

This changes the guard from `item.state === 'locked'` to `item.state !== 'owned'`, which blocks both `available` and `locked` states from opening the enlarged view.

### 2. No CSS changes needed

The user wants to keep the existing visual behavior:
- `cursor: pointer` stays on `.card-item--available` — the cursor still indicates interactivity
- The hover effect (lift + shadow) stays on `.card-item--available` — visual feedback remains
- Only the click handler behavior changes

## Visual Behavior Matrix (Updated)

| User Type | Card ID Range | Collected? | State | Visual | Clickable? |
|-----------|--------------|------------|-------|--------|-----------|
| Premium | 1-64 | Yes | `owned` | Image face-up, owned border | ✅ Yes |
| Premium | 1-64 | No | `available` | Card back (back.png) | ❌ No |
| Non-premium | 1-14 | Yes | `owned` | Image face-up, owned border | ✅ Yes |
| Non-premium | 1-14 | No | `available` | Card back (back.png) | ❌ No |
| Non-premium | 15-64 | No (always) | `locked` | Dark gray blurred + lock icon | ❌ No |

## Interaction Rules (Updated)

| Action | Owned | Available (card back) | Locked |
|--------|-------|----------------------|--------|
| Click/tap card | Opens enlarged card detail | Nothing | Nothing |
| Lock icon click | N/A | N/A | Shows premium message |
| Hover (desktop) | Lift + shadow | Lift + shadow (kept) | No hover effect |
| Premium purchase | N/A | N/A | Immediately refreshes all locked → available |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/pages/collection/collection.ts` | Change `selectCard()` guard from `item.state === 'locked'` to `item.state !== 'owned'` |

Only **one file** needs to be modified. No CSS changes required.

## Edge Cases

1. **Premium user with unowned cards**: Available cards (card back) will no longer be clickable — correct, since the user hasn't obtained them yet.
2. **New card obtained via prediction**: When the user returns to collection after obtaining a card, it will be in `owned` state and clickable — correct behavior.
3. **No behavioral change for locked cards**: Locked cards remain non-clickable as before.
