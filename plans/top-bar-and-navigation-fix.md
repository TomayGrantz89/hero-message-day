# Plan: Top Bar Styling, Remove Home Page, Active Icon Highlight

## Overview

Three changes requested by the user:

1. **Top bar styling** — Make the top bar match the bottom bar color (iOS-style translucent background), show the app title, and respect safe-area insets (distance from phone status bar/menu and from page content).
2. **Remove home page** — Make the Prediction page the default/first page instead of the Home page.
3. **Active icon highlight** — Darken/semi-transparent background around the active navigation icon so the user knows which page is open.

---

## Current State

### Top Bar (`src/app/components/top-bar/`)
- Currently has `background: transparent` and `pointer-events: none`
- Title "Карта дня" is visible but has no background
- No visual separation from phone status bar

### Routes (`src/app/app.routes.ts`)
- `''` (empty path) → Home component
- `'prediction'` → Prediction component
- `'collection'` → Collection component
- `'question'` → Question component

### Bottom Bar (`src/app/components/bottom-bar/`)
- First nav item links to `'/'` (Home) with label "Карта дня"
- Active state only changes icon/label color to blue (`#007AFF`)
- No background highlight around the active icon

### App Shell (`src/app/app.html`)
- `<app-top-bar></app-top-bar>` followed by `<router-outlet></router-outlet>` then `<app-bottom-bar></app-bottom-bar>`

---

## Changes Required

### 1. Top Bar Styling

**File: `src/app/components/top-bar/top-bar.scss`**

- Change `background: transparent` → `background: rgba(242, 242, 247, 0.94)` (same as bottom bar)
- Add `backdrop-filter: blur(20px)` and `-webkit-backdrop-filter: blur(20px)` (same as bottom bar)
- Add `border-bottom: 0.5px solid rgba(60, 60, 67, 0.12)` (same style as bottom bar's top border)
- Remove `pointer-events: none` from `.top-bar`
- Keep `padding-top: env(safe-area-inset-top, 0px)` for status bar spacing
- Keep `padding-left: 16px` for left margin from screen edge
- The title already has proper padding; ensure the bar height accommodates the title with safe-area

**File: `src/app/components/top-bar/top-bar.html`**

- No changes needed — already has `<div class="top-bar-title">Карта дня</div>`

### 2. Remove Home Page — Make Prediction the Default

**File: `src/app/app.routes.ts`**

- Change `{ path: '', component: Home }` → `{ path: '', redirectTo: 'prediction', pathMatch: 'full' }`
- This makes the app open directly to the Prediction page

**File: `src/app/components/bottom-bar/bottom-bar.ts`**

- Change the first nav item's `link` from `'/'` to `'/prediction'`
- Change the first nav item's `label` from `'Карта дня'` to `'Предсказание'` (or keep "Карта дня" — user's preference)
- Update `updateActiveRoute()` method:
  - Remove the special case for `item.link === '/'`
  - Now all nav items use `url.startsWith(item.link)` uniformly

**File: `src/app/app.html`**

- No changes needed — the shell stays the same

**File: `src/app/pages/home/`**

- The Home component files (`home.html`, `home.ts`, `home.scss`) can remain in the project but will no longer be routed to. They can be cleaned up later.

### 3. Active Icon Background Highlight

**File: `src/app/components/bottom-bar/bottom-bar.scss`**

Add a semi-transparent background around the active nav item:

```scss
.nav-item.active {
  background: rgba(0, 122, 255, 0.1);  // light blue tint
  border-radius: 12px;
  padding: 4px 12px;  // slightly more horizontal padding for the background
  
  .nav-icon {
    color: #007AFF;
  }
  .nav-label {
    color: #007AFF;
  }
}
```

This creates a subtle rounded rectangle behind the active icon+label, making it visually clear which tab is selected.

---

## Detailed File-by-File Changes

### File 1: `src/app/components/top-bar/top-bar.scss`

| Change | Description |
|--------|-------------|
| `.top-bar { background: transparent → background: rgba(242, 242, 247, 0.94)` | Match bottom bar color |
| Add `backdrop-filter: blur(20px)` | Frosted glass effect |
| Add `-webkit-backdrop-filter: blur(20px)` | Safari support |
| Add `border-bottom: 0.5px solid rgba(60, 60, 67, 0.12)` | Subtle separator line |
| Remove `pointer-events: none` | Allow interactions if needed |

### File 2: `src/app/app.routes.ts`

| Change | Description |
|--------|-------------|
| `{ path: '', component: Home }` → `{ path: '', redirectTo: 'prediction', pathMatch: 'full' }` | Default route redirects to prediction |
| Remove `import { Home } from './pages/home/home'` | No longer needed |

### File 3: `src/app/components/bottom-bar/bottom-bar.ts`

| Change | Description |
|--------|-------------|
| First nav item: `link: '/'` → `link: '/prediction'` | Point "Карта дня" to prediction page |
| `updateActiveRoute()`: Remove special `if (item.link === '/')` case | Simplify to uniform `url.startsWith(item.link)` |

### File 4: `src/app/components/bottom-bar/bottom-bar.scss`

| Change | Description |
|--------|-------------|
| Add `.nav-item.active { background: rgba(0, 122, 255, 0.1); border-radius: 12px; }` | Subtle highlight around active icon |

---

## Visual Flow Diagram

```mermaid
flowchart TD
    A[App Shell app.html] --> B[Top Bar: Карта дня]
    A --> C[Router Outlet]
    A --> D[Bottom Bar]
    
    C --> E[Default: /prediction]
    C --> F[/collection]
    C --> G[/question]
    
    D --> H[Nav Item 1: Предсказание /prediction]
    D --> I[Nav Item 2: Оракул /question]
    D --> J[Nav Item 3: Коллекция /collection]
    D --> K[Nav Item 4: Магазин modal]
    
    H -.-> L[Active: blue tint background]
    I -.-> L
    J -.-> L
```

---

## Implementation Order

1. **Top bar styling** — Update `top-bar.scss` with background, blur, border
2. **Routes** — Update `app.routes.ts` to redirect `/` to `/prediction`
3. **Bottom bar nav items** — Update `bottom-bar.ts` to change first item link to `/prediction`
4. **Bottom bar active highlight** — Update `bottom-bar.scss` with active background style
5. **Verify** — Check that the app loads directly to Prediction page, top bar has proper styling, and active icon has highlight

---

## Files Not Modified

- `src/app/pages/home/*` — Left in place but no longer routed to (can be deleted later)
- `src/app/app.html` — No changes needed
- `src/app/app.ts` — No changes needed
- `src/app/app.scss` — No changes needed (body padding already accounts for bottom bar)
- `src/app/pages/prediction/*` — No changes needed (already has proper padding-top for top bar)
