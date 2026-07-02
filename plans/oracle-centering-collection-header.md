# Oracle Page Vertical Centering & Collection Page Header Removal

## Task 1: Oracle Page — Vertical Centering

### Current Layout (question.html + question.scss)

The oracle page has this structure:
- `.question-container` — full-height container with padding-top/padding-bottom
- `.question-content` — contains all content
  - `.instruction` — text instruction (margin-bottom: 40px)
  - `.card-area` — magic ball image (margin-bottom: 50px)
  - `.beautiful-answer` — answer block (margin: 40px auto) — shown only when answer exists
  - `.attempts-info` — attempts counter (margin-bottom: 40px)

**Problem**: Content is top-aligned. Space above the magic ball (between instruction and top of viewport) is much larger than space below the attempts counter (between counter and bottom menu).

### Required Layout

Space above the magic ball (from top of `.question-content` to the ball) should be **approximately equal** to space below the attempts counter (from counter to bottom of `.question-content`).

### Changes Needed

#### question.scss — `.question-content`

Add `flex: 1` and `display: flex` with `flex-direction: column` and `justify-content: center` to vertically center the content block. However, since `.question-content` is inside `.question-container` which already has padding, the better approach is:

1. Make `.question-container` use `display: flex; flex-direction: column;`
2. Make `.question-content` use `flex: 1; display: flex; flex-direction: column; justify-content: center;`

This will push the content block (instruction + ball + answer + attempts) to the vertical center.

#### question.scss — Reduce margins

Once `justify-content: center` is applied, reduce the large fixed margins that push content down:

- `.instruction` `margin-bottom`: 40px → 20px
- `.card-area` `margin-bottom`: 50px → 20px
- `.beautiful-answer` `margin`: 40px auto → 20px auto
- `.attempts-info` `margin-bottom`: 40px → 10px

These reduced margins, combined with `justify-content: center`, will naturally center the content block vertically.

#### Responsive breakpoints

Update the same margins in the `@media (max-width: 768px)` section.

### Files to Change

| File | Changes |
|------|---------|
| `src/app/pages/question/question.scss` | `.question-container`: add `display: flex; flex-direction: column;` |
| `src/app/pages/question/question.scss` | `.question-content`: add `flex: 1; display: flex; flex-direction: column; justify-content: center;` |
| `src/app/pages/question/question.scss` | Reduce `.instruction` `margin-bottom`: 40px → 20px |
| `src/app/pages/question/question.scss` | Reduce `.card-area` `margin-bottom`: 50px → 20px |
| `src/app/pages/question/question.scss` | Reduce `.beautiful-answer` `margin`: 40px auto → 20px auto |
| `src/app/pages/question/question.scss` | Reduce `.attempts-info` `margin-bottom`: 40px → 10px |

---

## Task 2: Collection Page — Remove "Коллекция карт" Header

### Current Layout (collection.html:2-7)

```html
<header class="header">
  <h1>Коллекция карт</h1>
  <div class="stats" *ngIf="isPremium">
    <div>Получено: {{ getCollectedCount() }} / {{ totalCards }}</div>
  </div>
</header>
```

### Required

Remove the entire `<header>` block (lines 2-7) so the page starts directly with `<main class="main">`.

### Changes Needed

#### collection.html

Remove lines 2-7 (the `<header>` element with its `h1` and `stats`).

#### collection.scss (optional cleanup)

The `.header` styles (lines 17-43) and `.header .stats` (lines 852-857) become dead code. They can be left in place (no harm) or removed for cleanliness. Recommend removing them to keep the stylesheet clean.

### Files to Change

| File | Changes |
|------|---------|
| `src/app/pages/collection/collection.html` | Remove `<header class="header">...</header>` block (lines 2-7) |
| `src/app/pages/collection/collection.scss` | Remove `.header` styles (lines 17-43) and `.header .stats` (lines 852-857) — optional cleanup |

---

## Summary

| Task | Files | Type |
|------|-------|------|
| Oracle vertical centering | `src/app/pages/question/question.scss` | SCSS changes |
| Remove collection header | `src/app/pages/collection/collection.html` | HTML removal |
| Remove collection header styles | `src/app/pages/collection/collection.scss` | SCSS cleanup (optional) |
