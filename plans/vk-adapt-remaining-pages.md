# Адаптация страниц «Оракул», «Коллекция», «Магазин» под VK Mini Apps

## Цель

Привести страницы `question` (оракул), `collection` (коллекция) и `shop` (магазин),
а также компонент `terms-modal` (открывается из магазина) к VK-стилю уже адаптированных
страниц `prediction` и `welcome`. Ничего не ломать: логика, структура HTML и поведение
не меняются, меняются только стили (тема, вьюпорт-единицы, отступы, safe-area).

## Эталонный паттерн (уже адаптированные страницы)

- [`src/styles.scss`](../src/styles.scss) — глобальная оболочка: CSS-переменные темы
  `--vk-*`, `body.vk-dark` переключает тему, контейнер до `--vk-max-width: 480px`,
  `100dvh`, системный скролл скрыт.
- [`prediction.scss`](../src/app/pages/prediction/prediction.scss) — компактные отступы:
  `padding: calc(env(safe-area-inset-top,0px) + 14px) 16px calc(58px + env(safe-area-inset-bottom,0px) + 18px)`.
- [`welcome.scss`](../src/app/pages/welcome/welcome.scss) — `100dvh`, `var(--vk-surface)`,
  `var(--vk-text-*)`, `var(--vk-accent)`.
- [`bottom-bar.scss`](../src/app/components/bottom-bar/bottom-bar.scss) — фиксированная
  навигация 58px + safe-area, цвета из переменных.

Принципы переноса:
1. Хардкод цветов светлой темы → `var(--vk-*)`.
2. `100vh` → `100dvh`.
3. Отступы сверху/снизу → как на странице предсказаний (14px сверху, 58px+18px снизу).
4. Стеклянные поверхности: `var(--vk-surface)` + `backdrop-filter`.
5. Интерактив: акцентные кнопки → `var(--vk-accent)`, вторичные → контур с акцентом.

## Файлы и изменения

### 1. Оракул — [`question.scss`](../src/app/pages/question/question.scss)

- `.question-container`
  - `min-height: 100vh` → `min-height: 100dvh`;
  - `color: #333` → `color: var(--vk-text-primary)`;
  - `padding-top: calc(env(safe-area-inset-top,0px) + 60px)` → `+ 14px`;
  - `padding-bottom: calc(70px + env(...) + 20px)` → `calc(58px + env(safe-area-inset-bottom,0px) + 18px)`;
  - в медиа-запросах `<768px` и `<480px` синхронно уменьшить верхние отступы
    (`+55px`/`+50px` → `+14px`; нижние — к единому виду 58px+18px).
- `.oracle-plaque`
  - `background: rgba(255,255,255,0.95)` → `var(--vk-surface)` (backdrop-filter оставить);
  - добавить лёгкую тень как у баннера предсказаний (`0 2px 10px rgba(90,105,140,.12)`).
- `.plaque-text`
  - `color: #3a3a4a` → `var(--vk-text-secondary)`;
  - `.answer` → `color: var(--vk-text-primary)`.
- `.button-section .timer-block`
  - фон → `var(--vk-surface)`;
  - `.timer-label` `#666` → `var(--vk-text-tertiary)`;
  - `.timer-value` `#3A4D8F` → `var(--vk-accent)`.
- `.rainbow-btn`
  - `$btn-bg: #fff` → `var(--vk-surface-solid)`;
  - `$btn-text-color: #666` → `var(--vk-text-secondary)`;
  - `$btn-text-hover: #000` → `var(--vk-text-primary)`;
  - радужную анимацию и геометрию не трогаем.
- Внутренние `max-width: 600px` НЕ меняем (родительская оболочка и так ограничивает 480px,
  визуально разницы нет, риск минимальный).

### 2. Оракул — [`question.ts`](../src/app/pages/question/question.ts)

- Удалить debug-логи `console.log('[DBG-Q] ...')` (в `ngOnInit`, подписке `premiumStatus$`,
  `updateRemainingQuestions()`, `askQuestion()`). Логика не меняется.

### 3. Коллекция — [`collection.scss`](../src/app/pages/collection/collection.scss)

- `.collection-container`
  - `min-height: 100vh` → `100dvh`;
  - `color: #333` → `var(--vk-text-primary)`;
  - `padding-top: calc(env(safe-area-inset-top,0px) + 60px)` → `+ 14px`;
  - `padding-bottom: calc(70px + ... + 20px)` → `calc(58px + env(safe-area-inset-bottom,0px) + 18px)`;
  - медиа-запросы `<768px`, `<480px`, landscape: верхние отступы `+40px+5px` / `+36px+5px`
    → `+14px`; нижние — 58px+18px.
- `.card-item` (и в `.swipe-page`, и в `.grid`)
  - `background: #fff` → `var(--vk-surface-solid)`;
  - `border: 1px solid #c8c0e8` → `border: 1px solid var(--vk-separator)`.
- `.card-item--owned` — тёмную рамку `#0D0528` оставить (декоративный брендовый цвет,
  читается на обеих темах).
- `.card-item--available` / `.card-item--locked` — тёмные «рубашки» карт оставить
  (это графика карт, зависит от темы).
- `.premium-message`
  - `background: rgba(255,255,255,0.85)` → `var(--vk-surface)`;
  - `color: rgba(60,60,67,0.75)` → `var(--vk-text-secondary)`.
- Overlay увеличенной карты: тёмные цвета оставить (карта-спина намеренно тёмная).

### 4. Магазин — [`shop.component.scss`](../src/app/pages/shop/shop.component.scss)

- `.shop-container`
  - добавить отступы: `padding: calc(env(safe-area-inset-top,0px) + 14px) 24px calc(58px + env(safe-area-inset-bottom,0px) + 24px);`
    (сейчас только `padding: 24px` — нижнюю часть закрывает фиксированная навигация);
  - инлайновый `style="margin-top: 55px"` из HTML убрать (переезжает в SCSS как padding-top).
- `.product-card`
  - `background: #ffffff` → `var(--vk-surface-solid)`.
- `.product-name` → `color: var(--vk-text-primary)`.
- `.product-description` `#666666` → `var(--vk-text-secondary)`.
- `.terms-disclaimer` `#999999` → `var(--vk-text-tertiary)`.
- `.terms-link` `#2196f3` → `var(--vk-accent)`.
- `.buy-button` `#4caf50` → `background: var(--vk-accent)` (сплошная, белый текст).
- `.restore-button` `#2196f3` → контурный стиль как у восстановления в bottom-bar:
  `background: transparent; color: var(--vk-accent)`.
- `:disabled` — оставить.

### 5. Магазин — [`shop.component.html`](../src/app/pages/shop/shop.component.html)

- Убрать `style="margin-top: 55px;"` с `.product-card`.

### 6. Термы — [`terms-modal.scss`](../src/app/components/terms-modal/terms-modal.scss)

- `.terms-card`: `background: #ffffff` → `var(--vk-surface-solid)`;
  `max-width: 600px` → `var(--vk-max-width)`; `max-height: 80vh` → `80dvh`.
- `.terms-close-btn`: фон `rgba(0,0,0,0.06)` → `var(--vk-surface-hover)`;
  `color: #666` → `var(--vk-text-tertiary)`; hover `#333` → `var(--vk-text-secondary)`.
- `.terms-title` / `.terms-section-title`: `#0a1e3d` → `var(--vk-text-primary)`.
- `.terms-divider`: `#e5e5ea` → `var(--vk-separator)`.
- `.terms-text`: `#3a3a4a` → `var(--vk-text-secondary)`.
- `.terms-bottom-btn`: `#007AFF` → `var(--vk-accent)`.

## Что НЕ меняем

- Логику TS (покупки, попытки, таймеры, свайпы).
- `alert()`-диалоги (по решению пользователя оставляем как есть).
- Тёмные «рубашки» и задники карт, декоративные брендовые цвета карточек коллекции.
- Структуру HTML (кроме удаления inline-отступа в магазине).

## Проверка

1. Dev-сервер уже запущен (`127.0.0.1:4200`).
2. В обычном браузере проверить три страницы + магазин с модалкой термов:
   - контент не перекрывается нижней навигацией;
   - сверху нет лишнего пустого пространства;
   - цвета соответствуют светлой теме.
3. Тёмная тема: в консоли браузера временно добавить класс
   `document.body.classList.add('vk-dark')` (или через эмуляцию VK Bridge) и убедиться,
   что плашки/тексты/кнопки читаются на тёмном фоне.
4. Убедиться, что на странице предсказаний ничего не изменилось (её не трогаем).
