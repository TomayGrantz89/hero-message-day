# Plan: Consistent Small Gap Between Button and Card on All Devices

## Goal

Сделать расстояние между кнопкой (или таймером) и картой на странице предсказания одинаково небольшим на всех устройствах. Эталонное значение — **80px** (как указано в `min-height: 80px` на 480px).

## Problem

Сейчас расстояние между `.action-area` (кнопка/таймер) и `.card-wrapper` (карта) регулируется через `min-height` на `.action-area`, и это значение меняется на разных breakpoint'ах:

| Breakpoint | `min-height` `.action-area` | Высота кнопки | Эффективный зазор под кнопкой |
|---|---|---|---|
| >768px | 140px | ~56px | ~84px |
| ≤768px | 130px | ~52px | ~78px |
| ≤480px | 120px | ~50px | ~70px |
| ≤360px | наследует 120px | ~46px | ~74px |

Из-за этого расстояние между кнопкой и картой плавает от устройства к устройству.

## Solution

Заменить `min-height` на `.action-area` на **фиксированный `margin-bottom`** во всех breakpoint'ах. Это гарантирует, что расстояние от нижнего края контента `.action-area` (кнопка или таймер) до верхнего края `.card-wrapper` будет одинаковым на всех устройствах.

### Какие изменения в [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### 1. Base `.action-area` (строка ~220)

**Было:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 10px;
  ...
  max-width: 320px;
  min-height: 140px;
```

**Стало:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 80px;   /* фиксированный отступ — одинаково на всех устройствах */
  ...
  max-width: 320px;
  /* min-height удалён */
```

#### 2. `@media (max-width: 768px)` — `.action-area` (строка ~383)

**Было:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 0;
  max-width: 280px;
  min-height: 130px;
```

**Стало:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 80px;
  max-width: 280px;
```

#### 3. `@media (max-width: 480px)` — `.action-area` (строка ~469)

**Было:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 0;
  max-width: 260px;
  min-height: 120px;
```

**Стало:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 80px;
  max-width: 260px;
```

#### 4. `@media (max-width: 768px) and (orientation: landscape)` — `.action-area` (строка ~580)

**Было:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 0;
}
```

**Стало:**
```scss
.action-area {
  margin-top: 0;
  margin-bottom: 80px;
}
```

### HTML менять не нужно

Структура в `prediction.html` корректная — `.action-area` находится над `.card-wrapper` внутри `.main` (flex-контейнер). Нужны только CSS-правки.

### Результат

На всех устройствах (от больших экранов до самых маленьких смартфонов, включая landscape-ориентацию) расстояние от нижнего края кнопки/таймера до верхнего края карты будет одинаковым — **80px**. Это небольшой, аккуратный отступ, который не ломает существующую вёрстку.
