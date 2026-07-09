# Plan: Fix Premium Message Persistence and Collection Auto-Refresh

## Overview

Two issues reported by the user:

1. **Premium message persists incorrectly** — The message "Пользователям премиума доступны все карты" (shown after clicking a lock icon) should disappear when:
   - The user purchases premium
   - The user navigates away from the collection page and comes back

2. **Collection page should refresh immediately after premium purchase** — When premium is purchased from any page (collection, bottom-bar shop, home, prediction, question), the collection page should immediately reflect the change (locked cards → available).

---

## Current State Analysis

### Issue 1: Premium Message Persistence

**Current code in `collection.ts`:**
- `showPremiumMessage` is initialized as `false`
- `onLockClick()` sets it to `true`
- `purchasePremium()` sets it to `false`
- **Missing:** `showPremiumMessage` is never reset in `ngOnInit()` or `updatePremiumStatus()`

**Template condition:** `*ngIf="showPremiumMessage && !isPremium"` — this partially handles the purchase case (since `isPremium` becomes `true`), but:
- If a non-premium user clicks lock → sees message → navigates away → comes back → message is still visible (because `showPremiumMessage` is still `true`)
- The `!isPremium` guard doesn't help here since the user is still non-premium

### Issue 2: Collection Auto-Refresh After Premium Purchase

**Current code in `collection.ts` `purchasePremium()`:**
```typescript
purchasePremium(): void {
    this.premium.activatePremium();
    this.isPremium = true;
    this.showPremiumMessage = false;
    this.attemptService.refreshPredictionAttempts();
    this.attemptService.refreshQuestionAttempts();
    this.loadCollection();  // ✅ Already refreshes collection
}
```

This works correctly **if premium is purchased from within the collection page itself**.

**Problem:** Premium can also be purchased from:
- `bottom-bar.ts` — shop modal (line 111-118)
- `home.ts` — home page (line 25-32)
- `prediction.ts` — prediction page (line 176-184)
- `question.ts` — question page (line 94-100)

If the user is on the collection page and purchases premium from the bottom-bar shop modal, the collection page is **not notified** and continues to show locked cards.

---

## Proposed Changes

### Change 1: Reset `showPremiumMessage` on page init

**File:** `src/app/pages/collection/collection.ts`

Add `showPremiumMessage = false` to `updatePremiumStatus()` (which is called from `ngOnInit()`):

```typescript
private updatePremiumStatus(): void {
    this.isPremium = this.premium.isPremium();
    this.showPremiumMessage = false;  // Reset message on page re-entry
}
```

This ensures the premium message is always cleared when the user enters/re-enters the collection page.

### Change 2: Subscribe to premium status changes for cross-page refresh

**File:** `src/app/pages/collection/collection.ts`

The collection page needs to react to premium purchases made from other components (bottom-bar shop modal, home page, etc.).

**Option A (Recommended): Use a simple BehaviorSubject in Premium service**

Add a `premiumStatusChanged$` observable to the `Premium` service that emits whenever premium status changes. The collection page subscribes to it and refreshes.

**Changes to `src/app/services/premium.ts`:**
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';
  private readonly QUESTION_ATTEMPTS_KEY = 'cardGameQuestionAttempts';
  private readonly QUESTION_LAST_RESET_KEY = 'cardGameQuestionLastReset';

  // New: Observable for premium status changes
  private premiumStatusSource = new BehaviorSubject<boolean>(this.isPremium());
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

  // ... existing code ...

  activatePremium(): void {
    localStorage.setItem(this.PREMIUM_KEY, 'true');
    localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, new Date().toISOString());
    localStorage.setItem(this.QUESTION_ATTEMPTS_KEY, '5');
    const today = new Date().toDateString();
    localStorage.setItem(this.QUESTION_LAST_RESET_KEY, today);
    this.premiumStatusSource.next(true);  // Notify subscribers
  }

  deactivatePremium(): void {
    localStorage.removeItem(this.PREMIUM_KEY);
    localStorage.removeItem(this.PREMIUM_PURCHASE_DATE_KEY);
    this.premiumStatusSource.next(false);  // Notify subscribers
  }
}
```

**Changes to `src/app/pages/collection/collection.ts`:**
```typescript
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';

export class Collection implements OnInit, OnDestroy {
  // ... existing properties ...
  private premiumSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.calculateCardsPerSwipe();
    this.updatePremiumStatus();
    this.loadCollection();

    // Subscribe to premium status changes (e.g., purchased from bottom-bar shop)
    this.premiumSubscription = this.premium.premiumStatus$.subscribe(isPremium => {
      this.isPremium = isPremium;
      this.showPremiumMessage = false;
      if (isPremium) {
        // Refresh attempts when premium is activated from another page
        this.attemptService.refreshPredictionAttempts();
        this.attemptService.refreshQuestionAttempts();
      }
      this.loadCollection();
    });
  }

  ngOnDestroy(): void {
    if (this.premiumSubscription) {
      this.premiumSubscription.unsubscribe();
    }
  }

  // ... rest of existing code ...
}
```

### Change 3: Simplify `purchasePremium()` in collection.ts

Since the observable subscription now handles the refresh, `purchasePremium()` can be simplified:

```typescript
purchasePremium(): void {
    this.premium.activatePremium();  // This will trigger the observable
    // The subscription in ngOnInit will handle:
    //   - this.isPremium = true
    //   - this.showPremiumMessage = false
    //   - this.loadCollection()
    //   - refreshing attempts
}
```

However, to keep things explicit and avoid race conditions, we can keep the existing code as-is since it's already correct. The observable subscription will handle the cross-page case.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/services/premium.ts` | Add `BehaviorSubject` + `premiumStatus$` observable; emit on `activatePremium()` and `deactivatePremium()` |
| `src/app/pages/collection/collection.ts` | Add `OnDestroy`, subscribe to `premiumStatus$`, reset `showPremiumMessage` in `updatePremiumStatus()` |

---

## Visual Behavior After Changes

| Scenario | Before | After |
|----------|--------|-------|
| Non-premium clicks lock icon, navigates away, comes back | Message still visible | Message hidden (reset on init) |
| Purchases premium from collection page | Collection refreshes ✅ | Collection refreshes ✅ (no change) |
| Purchases premium from bottom-bar shop while on collection page | Collection still shows locked cards | Collection immediately refreshes, locked → available |
| Purchases premium from home page, then navigates to collection | Collection shows correct state (reads from localStorage) | Collection shows correct state ✅ (no change needed, but observable ensures consistency) |

---

## Edge Cases

1. **Component destruction**: Subscription is properly cleaned up in `ngOnDestroy()` to prevent memory leaks.
2. **Multiple rapid purchases**: The observable emits the latest value, so rapid purchases are handled correctly.
3. **Premium deactivation**: If premium is deactivated (testing/refund), the observable notifies the collection to refresh with locked cards.
4. **Initial load**: `BehaviorSubject` initializes with the current premium status, so the subscription callback won't trigger unnecessarily on init (since `ngOnInit` already calls `updatePremiumStatus()` and `loadCollection()`).
