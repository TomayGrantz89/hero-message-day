# План: Нижняя навигационная панель (Bottom Navigation Bar)

## Цель
Добавить фиксированную нижнюю плашку с 4 иконками-навигацией на всех страницах приложения. Модифицировать верхнюю плашку (top-bar) — оставить только название "Карта дня" слева.

---

## 1. Текущая архитектура

### Сейчас:
- **app.html** — только `<router-outlet></router-outlet>`
- **top-bar** — компонент с навигацией (стрелка назад) и премиум-кнопкой/статусом. Используется на каждой странице индивидуально через `<app-top-bar>`
- **Страницы** (home, prediction, collection, question) — каждая сама подключает `TopBarComponent` и размещает его в своём шаблоне

### Проблемы текущей архитектуры:
- Top-bar дублируется на каждой странице
- Нет единой нижней навигации
- Премиум-кнопка занимает место в top-bar

---

## 2. Новая архитектура

```
app.html
├── app-top-bar (модифицированный — только "Карта дня" слева)
├── <router-outlet> (контент страниц)
└── app-bottom-bar (новая нижняя плашка с 4 иконками)
```

### Ключевые изменения:
1. **Top-bar** — переносится в `app.html` как глобальный компонент, а не на каждую страницу. Содержит только текст "Карта дня" слева, учитывает `safe-area-inset-top`
2. **Bottom-bar** — новый компонент, фиксированный внизу, с 4 иконками: Карта дня, Оракул, Коллекция, Магазин. Учитывает `safe-area-inset-bottom`
3. **Страницы** — больше не подключают `TopBarComponent`, получают `padding-top` под top-bar и `padding-bottom` под bottom-bar

---

## 3. Детальный план реализации

### Шаг 1: Создать SVG-иконки

Создать 4 SVG-файла в `src/assets/ui/`:

| Иконка | Файл | Описание | Назначение |
|--------|------|----------|------------|
| Карта дня | `icon-card.svg` | Карта/рубашка карты | Ссылка на `/` |
| Оракул | `icon-oracle.svg` | Хрустальный шар/магия | Ссылка на `/question` |
| Коллекция | `icon-collection.svg` | Сетка/альбом | Ссылка на `/collection` |
| Магазин | `icon-shop.svg` | Звёздочка премиума | Ссылка на страницу покупки премиума |

**Требования к иконкам:**
- Line-art стиль (в духе iOS SF Symbols)
- Толщина линии ~2px
- Размер viewBox 24x24
- Цвет по умолчанию — серый `#8E8E93` (iOS system gray)
- Активный/выбранный цвет — синий `#007AFF` (iOS system blue)
- Заливка: none (только обводка), кроме иконки магазина (звёздочка может быть с заливкой)

### Шаг 2: Создать компонент BottomBar

**Файлы:**
- `src/app/components/bottom-bar/bottom-bar.ts`
- `src/app/components/bottom-bar/bottom-bar.html`
- `src/app/components/bottom-bar/bottom-bar.scss`

**Логика (bottom-bar.ts):**
- Standalone-компонент
- Определяет текущий активный маршрут через `Router` + `NavigationEnd`
- Подсвечивает активную иконку
- 4 кнопки-ссылки с `routerLink`
- Для иконки "Магазин" — открытие модального окна с предложением премиума (или ссылка на отдельную страницу)

**Шаблон (bottom-bar.html):**
```html
<div class="bottom-bar">
  <a *ngFor="let item of navItems"
     [routerLink]="item.link"
     class="nav-item"
     [class.active]="item.isActive"
     (click)="item.onClick ? $event.preventDefault(); item.onClick() : null">
    <img [src]="item.icon" [alt]="item.label" class="nav-icon" />
    <span class="nav-label">{{ item.label }}</span>
  </a>
</div>
```

**Стили (bottom-bar.scss):**
- `position: fixed; bottom: 0; left: 0; right: 0;`
- `padding-bottom: env(safe-area-inset-bottom, 0px);`
- Фон: `rgba(240, 240, 245, 0.92)` — неброский серый (iOS style)
- Backdrop-filter: `blur(10px)` для эффекта матового стекла
- Высота: ~70px + safe-area-inset-bottom
- Иконки: 24x24px
- Подписи: 10px, system font
- Flexbox: равномерное распределение (`justify-content: space-around`)
- Активный элемент: синий цвет иконки и подписи
- Неактивный: серый `#8E8E93`
- `z-index: 1000`
- Border-top: тонкая линия `0.5px solid rgba(0,0,0,0.1)` (как в iOS)

### Шаг 3: Модифицировать TopBar

**Изменения в top-bar.html:**
- Убрать премиум-кнопку и премиум-статус
- Убрать стрелку "назад" (home icon)
- Оставить только `<div class="top-bar-title">Карта дня</div>`

**Изменения в top-bar.ts:**
- Убрать `@Input() showHomeIcon`
- Убрать `@Output() premiumPurchased`
- Убрать импорты `Premium` и `Attempt`
- Убрать методы `purchasePremium()` и `isPremium`

**Изменения в top-bar.scss:**
- Упростить: минимальная высота, учёт safe-area-inset-top
- Шрифт: небольшой, semibold, цвет тёмно-синий
- Фон: прозрачный или совпадает с фоном страницы

### Шаг 4: Обновить app.html и app.ts

**app.html:**
```html
<app-top-bar></app-top-bar>
<router-outlet></router-outlet>
<app-bottom-bar></app-bottom-bar>
```

**app.ts:**
- Импортировать `BottomBarComponent`
- Импортировать `TopBarComponent`
- Добавить оба в `imports`
- Убрать логику премиума (она теперь не нужна на уровне app)

### Шаг 5: Обновить app.scss

- Добавить `padding-top` для контента под top-bar (с учётом safe-area-inset-top)
- Добавить `padding-bottom` для контента над bottom-bar (с учётом safe-area-inset-bottom)
- Глобальные стили для body: `padding-bottom: env(safe-area-inset-bottom)` уже есть

### Шаг 6: Обновить страницы

Для каждой страницы (home, prediction, collection, question):

1. **Удалить** `<app-top-bar>` из шаблона
2. **Удалить** `TopBarComponent` из `imports` в ts-файле
3. **Удалить** методы `onPremiumPurchased()` (если они были только для top-bar)
4. **Добавить** `padding-top` в контейнере страницы (чтобы не перекрывалось top-bar)
5. **Добавить** `padding-bottom` в контейнере страницы (чтобы не перекрывалось bottom-bar)

### Шаг 7: Премиум-функциональность (Магазин)

Иконка "Магазин" (звёздочка) в bottom-bar будет открывать модальное окно с предложением купить премиум. Это можно реализовать двумя способами:

**Вариант A (рекомендуемый):** Модальное окно прямо в bottom-bar компоненте. При нажатии на "Магазин" показывается модалка с описанием преимуществ премиума и кнопкой покупки.

**Вариант B:** Создать отдельную страницу `/premium` и добавить её в маршрутизацию.

Рекомендуется Вариант A, так как он проще и не требует новой страницы.

---

## 4. Структура файлов после изменений

```
src/app/
├── app.html                    # + bottom-bar, top-bar
├── app.ts                      # + импорты bottom-bar, top-bar
├── app.scss                    # + padding для контента
├── components/
│   ├── top-bar/
│   │   ├── top-bar.html        # упрощён: только "Карта дня"
│   │   ├── top-bar.scss        # упрощён
│   │   └── top-bar.ts          # упрощён, без премиума
│   └── bottom-bar/             # НОВЫЙ КОМПОНЕНТ
│       ├── bottom-bar.html
│       ├── bottom-bar.scss
│       └── bottom-bar.ts
├── pages/
│   ├── home/
│   │   ├── home.html           # - app-top-bar
│   │   ├── home.scss           # + padding-top, padding-bottom
│   │   └── home.ts             # - TopBarComponent из imports
│   ├── prediction/
│   │   ├── prediction.html     # - app-top-bar
│   │   ├── prediction.scss     # + padding-top, padding-bottom
│   │   └── prediction.ts       # - TopBarComponent из imports
│   ├── collection/
│   │   ├── collection.html     # - app-top-bar
│   │   ├── collection.scss     # + padding-top, padding-bottom
│   │   └── collection.ts       # - TopBarComponent из imports
│   └── question/
│       ├── question.html       # - app-top-bar
│       ├── question.scss       # + padding-top, padding-bottom
│       └── question.ts         # - TopBarComponent из imports
└── services/
    └── premium.ts              # без изменений
```

---

## 5. Дизайн нижней плашки (iOS-style)

```
┌──────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← тонкий border-top (0.5px)
│                                                  │
│    🃏            🔮            📋            ⭐   │  ← 4 иконки 24x24
│  Карта дня    Оракул      Коллекция     Магазин   │  ← подписи 10px
│                                                  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← safe-area-inset-bottom
└──────────────────────────────────────────────────┘
```

**Цветовая схема:**
- Фон: `rgba(242, 242, 247, 0.94)` — светлый серый iOS
- Backdrop-filter: `blur(20px)` — матовое стекло
- Активный элемент: `#007AFF` (iOS blue)
- Неактивный элемент: `#8E8E93` (iOS gray)
- Разделитель сверху: `0.5px solid rgba(60, 60, 67, 0.12)`

---

## 6. Адаптивность

- На маленьких экранах (< 375px): иконки 22x22, подписи 9px
- На больших экранах (> 768px): иконки 26x26, подписи 11px
- Safe-area-inset-bottom учитывается всегда
- В ландшафтной ориентации на телефонах: плашка остаётся внизу, но можно уменьшить высоту

---

## 7. Риски и замечания

1. **Премиум-функциональность:** Иконка "Магазин" открывает модалку с покупкой премиума. Нужно убедиться, что логика премиума (сервис `premium.ts`) корректно вызывается из bottom-bar.
2. **Совместимость:** Все изменения обратно совместимы — старые страницы просто перестанут использовать top-bar.
3. **Навигация:** Иконка "Карта дня" ведёт на `/`, "Оракул" на `/question`, "Коллекция" на `/collection`, "Магазин" открывает модалку премиума.
4. **Активный маршрут:** Нужно корректно определять текущий маршрут через `Router.events`, чтобы подсвечивать активную иконку. Для "Магазина" активный маршрут не применяется (модалка).
