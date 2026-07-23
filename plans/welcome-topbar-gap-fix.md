# Plan: Fix Welcome Page Content Gap Below Top Bar

## Problem

The welcome page content (`.welcome-container`) sits behind the fixed top-bar because its `padding-top` only accounts for `env(safe-area-inset-top)` + a small offset, but does **not** include the top-bar's own height (44px on desktop).

## Root Cause

- [`top-bar`](src/app/components/top-bar/top-bar.scss:1) is `position: fixed` with height `calc(env(safe-area-inset-top, 0px) + 44px)`.
- [`welcome-container`](src/app/pages/welcome/welcome.scss:1) has `padding-top: calc(env(safe-area-inset-top, 0px) + 20px)` — missing the top-bar's 44px.

## Solution

Add the top-bar height to the `padding-top` calculation at every breakpoint, then add the desired 20px gap.

### File to modify

[`src/app/pages/welcome/welcome.scss`](src/app/pages/welcome/welcome.scss)

### Changes

| Breakpoint | Current `padding-top` | New `padding-top` | Top-bar height |
|---|---|---|---|
| Default (line 6) | `calc(env(safe-area-inset-top, 0px) + 20px)` | `calc(env(safe-area-inset-top, 0px) + 44px + 20px)` | 44px |
| ≤768px (line 178) | `calc(env(safe-area-inset-top, 0px) + 16px)` | `calc(env(safe-area-inset-top, 0px) + 40px + 20px)` | 40px |
| ≤480px (line 210) | `calc(env(safe-area-inset-top, 0px) + 12px)` | `calc(env(safe-area-inset-top, 0px) + 36px + 20px)` | 36px |
| ≤360px (line 262) | `calc(env(safe-area-inset-top, 0px) + 10px)` | `calc(env(safe-area-inset-top, 0px) + 36px + 20px)` | 36px |
| Landscape (line 281) | `calc(env(safe-area-inset-top, 0px) + 10px)` | `calc(env(safe-area-inset-top, 0px) + 36px + 20px)` | 36px |

### Implementation

Apply the following diffs to `src/app/pages/welcome/welcome.scss`:

1. **Line 6** (default): `padding-top: calc(env(safe-area-inset-top, 0px) + 44px + 20px);`
2. **Line 178** (≤768px): `padding-top: calc(env(safe-area-inset-top, 0px) + 40px + 20px);`
3. **Line 210** (≤480px): `padding-top: calc(env(safe-area-inset-top, 0px) + 36px + 20px);`
4. **Line 262** (≤360px): `padding-top: calc(env(safe-area-inset-top, 0px) + 36px + 20px);`
5. **Line 281** (landscape): `padding-top: calc(env(safe-area-inset-top, 0px) + 36px + 20px);`

### Verification

After applying the changes, the welcome page content should start 20px below the bottom of the fixed top-bar on all screen sizes.
