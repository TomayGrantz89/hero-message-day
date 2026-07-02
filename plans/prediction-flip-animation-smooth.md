# Prediction Card Flip Animation — Smooth iOS-like Easing

## Problem

The current card flip animation uses `cubic-bezier(0.175, 0.885, 0.32, 1.275)` with `0.8s` duration. This is an **overshoot/spring-like** easing curve — the card rotates past 180° and bounces back. This feels:

- **Too fast** at the start (the initial rotation is snappy)
- **Jarring** due to the overshoot bounce at the end
- **Not smooth** compared to iOS card flip animations which use spring physics or ease-out

The user wants a **crisp, smooth** flip like iOS — where the card rotates with a natural deceleration (ease-out) or a gentle spring without visible overshoot.

## Current Animation

Both the outer flip (`.card`) and inner flip (`.card-inner`) use:

```scss
transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

This bezier curve:
- `0.175` — starts moderately fast
- `0.885` — accelerates quickly
- `0.32` — overshoots past the target
- `1.275` — bounces back above 1.0 (overshoot)

**Visual result:** The card rotates past 180° and snaps back, which feels "springy" but not in a polished way.

## Solution: iOS-style Ease-Out with Gentle Spring

### Option A (Recommended): Custom Ease-Out with Subtle Spring

```scss
transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
```

This is the **Power4.easeOut** curve from GSAP — used extensively in iOS and modern UI animations:
- `0.22` — slow, graceful start (the card begins rotating gently)
- `1` — smooth acceleration
- `0.36` — decelerates naturally
- `1` — ends cleanly at the target (no overshoot)

**Why this works:**
- The card starts rotating **slowly** (feels deliberate, not rushed)
- Accelerates smoothly through the middle (the "whoosh" moment)
- Decelerates gently toward the end (no bounce, no snap)
- Total duration `0.6s` is slightly shorter than `0.8s` but feels **slower and smoother** because of the ease-out

### Option B: iOS Spring (if overshoot is desired)

```scss
transition: transform 0.65s cubic-bezier(0.32, 0.72, 0, 1);
```

This mimics iOS spring animation:
- `0.32` — controlled start
- `0.72` — builds momentum
- `0` — overshoots slightly past target
- `1` — settles back cleanly

The overshoot is **barely perceptible** — just enough to feel "alive" without being distracting.

### Option C: Pure Ease-Out (safest, most predictable)

```scss
transition: transform 0.7s cubic-bezier(0.0, 0.0, 0.2, 1);
```

Material Design's standard ease-out curve:
- Starts fast, decelerates to rest
- No overshoot at all
- Very predictable and clean

## Recommendation

**Use Option A** (`cubic-bezier(0.22, 1, 0.36, 1)`) for both the outer and inner flip transitions. It provides the best balance of:
- iOS-like smoothness
- Natural deceleration
- No jarring overshoot
- Professional, polished feel

## Changes Required

### File: [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

Two CSS transitions need updating — one for the outer card flip and one for the inner card-inner flip:

#### 1. Outer card flip (line 87)

**Current:**
```scss
transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

**Replace with:**
```scss
transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
```

#### 2. Inner card-inner flip (line 131)

**Current:**
```scss
transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

**Replace with:**
```scss
transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
```

## Visual Comparison of Easing Curves

```
Progress
1.0 ┤─────────────────────────────────●──
    │                                 ○
    │                            ○
0.8 ┤                       ○
    │                    ○
0.6 ┤                 ○
    │              ○
0.4 ┤           ○
    │        ○
0.2 ┤     ○
    │  ○
0.0 ┤●──○──○──○──○──○──○──○──○──○──○──○──→ Time
    0  0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0

● = Current (overshoot) — goes past 1.0 and bounces back
○ = Option A (ease-out) — smooth deceleration to 1.0
```

The current curve (●) overshoots past the target (above 1.0 on the progress axis) and bounces back. Option A (○) smoothly decelerates to exactly 1.0 — no bounce, no snap.

## Files to Modify

| File | Change |
|------|--------|
| [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) | Line 87: Change outer card `transition` to `0.6s cubic-bezier(0.22, 1, 0.36, 1)` |
| [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) | Line 131: Change inner card-inner `transition` to `0.6s cubic-bezier(0.22, 1, 0.36, 1)` |

## Verification

- [ ] First click (back → face): card flips smoothly with ease-out deceleration
- [ ] Second click (image → prediction): inner flip animates with same smooth curve
- [ ] Third click (prediction → image): inner flip reverses smoothly
- [ ] No overshoot/bounce at the end of either animation
- [ ] Animation feels deliberate and polished, not rushed
- [ ] Works on both mobile and desktop viewports
