# План: Замена пагинации на горизонтальный свайп в коллекции

## Цель
Убрать текущую пагинацию со страницы коллекции, уменьшить размер карточек, добавить горизонтальную карусель со свайпом и индикатор "1-6 из 64" под топ-баром слева. Изменения только для мобильных устройств (< 768px), на десктопе оставить как есть.

## Текущее состояние

### Страница коллекции (`src/app/pages/collection/`)
- **collection.ts**: Содержит логику пагинации (`currentPage`, `itemsPerPage`, `totalPages`, `paginatedCards`, `pageNumbers`, `goToPage()`, `nextPage()`, `previousPage()`, `generatePageNumbers()`)
- **collection.html**: Содержит сетку `.grid` с `*ngFor="let item of paginatedCards"` и блок `.pagination-container` с кнопками страниц
- **collection.scss**: Содержит стили для `.pagination-container`, `.page-btn`, `.pagination-btn` и т.д.

### Топ-бар (`src/app/components/top-bar/`)
- Глобальный компонент, отображается на всех страницах
- Содержит заголовок "Карта дня"

### Логика карточек
- Всего карт: 64 (для premium), 14 (для обычных)
- `itemsPerPage` рассчитывается в `calculateItemsPerPage()` в зависимости от ширины экрана
- Для мобильных portrait: 6 карт (3 колонки × 2 ряда)
- Для мобильных landscape: 8 карт (4 колонки × 2 ряда)

## План изменений

### Шаг 1: Убрать текущую пагинацию из HTML

**Файл**: `src/app/pages/collection/collection.html`

**Что сделать**:
- Удалить весь блок `.pagination-container` (строки 10-27)
- Изменить `*ngFor="let item of paginatedCards"` на `*ngFor="let item of collectionCards"` — показывать все карты сразу

**Почему**: Пагинация больше не нужна, все карты будут отображаться в горизонтальной карусели.

### Шаг 2: Убрать логику пагинации из TS

**Файл**: `src/app/pages/collection/collection.ts`

**Что сделать**:
- Удалить свойства: `currentPage`, `itemsPerPage`, `totalPages`, `paginatedCards`, `pageNumbers`
- Удалить методы: `goToPage()`, `nextPage()`, `previousPage()`, `generatePageNumbers()`, `calculateItemsPerPage()`
- Упростить `updatePagination()` — теперь он будет только устанавливать `collectionCards` (или переименовать в `loadCollection()`)
- Удалить `@HostListener('window:resize')` и `onResize()` — они больше не нужны
- Удалить импорт `HostListener` из `@angular/core`

**Важно**: Сохранить методы `selectCard()`, `closeDetail()`, `flipDetail()`, `getCollectedCount()`, `purchasePremium()`, `updatePremiumStatus()` — они не связаны с пагинацией.

### Шаг 3: Добавить свойства для карусели в TS

**Файл**: `src/app/pages/collection/collection.ts`

**Что сделать**:
- Добавить свойство `currentSwipePage = 0` — текущая страница карусели (0-индекс)
- Добавить свойство `cardsPerSwipe = 6` — количество карт на один экран карусели (для мобильных)
- Добавить свойство `swipePages: CollectionCard[][] = []` — массив страниц карусели
- Добавить метод `buildSwipePages()` — разбивает `collectionCards` на страницы по `cardsPerSwipe`
- Добавить метод `onSwipeLeft()` / `onSwipeRight()` — обработчики свайпа
- Добавить геттер `currentRangeStart` — вычисляет "1-6" для индикатора
- Добавить геттер `currentRangeEnd` — вычисляет "6" для индикатора
- Добавить геттер `totalCardsCount` — общее количество карт (64 или 14)

### Шаг 4: Обновить HTML для карусели

**Файл**: `src/app/pages/collection/collection.html`

**Что сделать**:
- Заменить `.grid` на контейнер карусели с горизонтальным скроллом
- Добавить блок индикатора под топ-баром: `<div class="swipe-indicator">1-6 из 64</div>`
- Добавить touch-обработчики: `(touchstart)`, `(touchmove)`, `(touchend)` для свайпа
- Карусель должна содержать все карты, но показывать только `cardsPerSwipe` за раз
- Использовать CSS transform: translateX для анимации перелистывания

**Структура HTML**:
```html
<!-- Индикатор под топ-баром -->
<div class="swipe-indicator" *ngIf="!showDetail">
  {{ currentRangeStart }}-{{ currentRangeEnd }} из {{ totalCardsCount }}
</div>

<!-- Контейнер карусели (только для мобильных) -->
<div class="swipe-container" *ngIf="!showDetail"
     (touchstart)="onTouchStart($event)"
     (touchmove)="onTouchMove($event)"
     (touchend)="onTouchEnd($event)">
  <div class="swipe-track" [style.transform]="'translateX(' + (-currentSwipePage * 100) + '%)'">
    <div class="swipe-page" *ngFor="let page of swipePages">
      <div class="card-item" [class.card-item--locked]="!item.owned" [class.card-item--owned]="item.owned"
           *ngFor="let item of page" (click)="selectCard(item)">
        <div class="card-image" *ngIf="item.owned" [style.backgroundImage]="'url(' + item.card.imageUrl + ')'"></div>
      </div>
    </div>
  </div>
</div>

<!-- Десктопная сетка (оставить как есть) -->
<div class="desktop-grid" *ngIf="!showDetail">
  ... существующая сетка для десктопа ...
</div>
```

### Шаг 5: Обновить SCSS

**Файл**: `src/app/pages/collection/collection.scss`

**Что сделать**:
- Удалить все стили `.pagination-container`, `.pagination`, `.page-numbers`, `.page-btn`, `.pagination-btn`, `.pagination-info`, `.ellipsis`
- Добавить стили для `.swipe-indicator`:
  - Position: absolute/fixed под топ-баром слева
  - Маленький, аккуратный текст
  - Цвет: серый/полупрозрачный
- Добавить стили для `.swipe-container`:
  - overflow: hidden
  - width: 100%
- Добавить стили для `.swipe-track`:
  - display: flex
  - transition: transform 0.3s ease
- Добавить стили для `.swipe-page`:
  - min-width: 100%
  - display: grid
  - grid-template-columns: repeat(3, 1fr) — 3 колонки
  - gap: 10px
  - padding: 10px
- Уменьшить размер карточек: `minmax(110px, 1fr)` → фактически в карусели они будут auto
- Скрыть карусель на десктопе (display: none при > 768px)
- Показать десктопную сетку только на > 768px

### Шаг 6: Обработка свайпа

**Файл**: `src/app/pages/collection/collection.ts`

**Логика**:
```typescript
private touchStartX = 0;
private touchEndX = 0;
private readonly SWIPE_THRESHOLD = 50; // минимальное расстояние для свайпа

onTouchStart(event: TouchEvent): void {
  this.touchStartX = event.touches[0].clientX;
}

onTouchMove(event: TouchEvent): void {
  this.touchEndX = event.touches[0].clientX;
}

onTouchEnd(event: TouchEvent): void {
  const diff = this.touchStartX - this.touchEndX;
  if (Math.abs(diff) > this.SWIPE_THRESHOLD) {
    if (diff > 0 && this.currentSwipePage < this.swipePages.length - 1) {
      this.currentSwipePage++; // свайп влево — следующая страница
    } else if (diff < 0 && this.currentSwipePage > 0) {
      this.currentSwipePage--; // свайп вправо — предыдущая страница
    }
  }
}
```

### Шаг 7: Индикатор страницы

**Логика**:
```typescript
get currentRangeStart(): number {
  return this.currentSwipePage * this.cardsPerSwipe + 1;
}

get currentRangeEnd(): number {
  const end = (this.currentSwipePage + 1) * this.cardsPerSwipe;
  return Math.min(end, this.collectionCards.length);
}

get totalCardsCount(): number {
  return this.collectionCards.length;
}
```

### Шаг 8: Адаптация для landscape

Для landscape на мобильных (`cardsPerSwipe = 8`, 4 колонки × 2 ряда):
- Изменять `cardsPerSwipe` при изменении ориентации
- Использовать `@HostListener('window:orientationchange')` для перестроения страниц
- Grid в `.swipe-page` для landscape: `grid-template-columns: repeat(4, 1fr)`

## Файлы для изменений

| Файл | Изменения |
|------|-----------|
| `src/app/pages/collection/collection.ts` | Удалить пагинацию, добавить свайп-логику, индикатор |
| `src/app/pages/collection/collection.html` | Удалить пагинацию HTML, добавить карусель и индикатор |
| `src/app/pages/collection/collection.scss` | Удалить стили пагинации, добавить стили карусели и индикатора |

## Что НЕ нужно менять

- `src/app/components/top-bar/` — топ-бар остается без изменений
- `src/app/services/` — сервисы не меняются
- `src/app/app.html` — глобальная структура не меняется
- Детальный просмотр карты (`.enlarged-card-overlay`) — не трогаем
- Десктопная версия (> 768px) — остается с существующей сеткой

## Проверка после изменений

1. На мобильных (< 768px):
   - Пагинация отсутствует
   - Карточки уменьшены до ~110-120px
   - Работает свайп влево/вправо
   - Индикатор показывает "1-6 из 64", "7-12 из 64" и т.д.
   - Детальный просмотр карты работает при клике
2. На десктопе (> 768px):
   - Всё как было (сетка, пагинация)
3. При смене ориентации (portrait/landscape):
   - Количество карт на странице меняется (6/8)
   - Индикатор обновляется
