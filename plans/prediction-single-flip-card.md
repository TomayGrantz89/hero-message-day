# Prediction Page — Single Flip Card Redesign

## Overview

Упрощаем механику карты: убираем отдельное увеличение (enlarged overlay). Карта работает как настоящая — у неё две стороны:

1. **Рубашка** (задняя сторона) — с узором
2. **Лицевая сторона** — при перевороте показывается картинка, а **сзади** (на оборотной стороне этой же карты) — предсказание на тёмно-сером фоне

**Одно нажатие** — карта красиво переворачивается с рубашки на лицо. Больше никаких дополнительных нажатий и увеличений.

---

## Current State vs Target State

### Сейчас (3 состояния)
```
Рубашка → нажатие → Картинка (лицо) → нажатие → Предсказание (текст) → нажатие → Увеличенный оверлей
```

### Цель (2 состояния)
```
Рубашка → нажатие → Карта переворачивается: спереди картинка, сзади предсказание
```

Карта переворачивается один раз и остаётся в перевёрнутом состоянии. Пользователь видит картинку спереди. Если захочет прочитать предсказание — может перевернуть телефон или просто видит, что предсказание на обратной стороне (как настоящая карта).

**Уточнение:** После переворота карта показывает **картинку (лицо)**. Предсказание находится на обратной стороне этой карты (rotateY(180deg)). То есть визуально: перевернули рубашку → увидели картинку. Предсказание — это "задняя сторона" картинки.

---

## Changes

### 1. HTML — [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

Упрощаем структуру: убираем 3 состояния, делаем 2 стороны одной карты.

```html
<div class="prediction-container">
  <main class="main">
    <p class="subtitle">{{ showCardFace ? '' : 'Нажмите на карту, чтобы открыть её' }}</p>

    <div class="card-wrapper" (click)="flipCard()">
      <div class="card" [class.flipped]="showCardFace">
        <!-- Back side (card back / рубашка) — видна когда showCardFace = false -->
        <div class="side back">
        </div>

        <!-- Face side (card image on front, prediction on back) — видна когда showCardFace = true -->
        <div class="side face">
          <div class="card-image" [style.backgroundImage]="'url(' + card?.imageUrl + ')'"></div>
          <div class="card-name-bar">
            <span class="card-name">{{ card?.name }}</span>
          </div>
          <!-- Prediction text on the back of the face side -->
          <div class="prediction-back">
            <p>{{ prediction?.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Button section under the card -->
    <div class="button-section" *ngIf="showButton">
      <button class="btn-action" (click)="onActionButtonClick()">
        {{ buttonText }}
      </button>
      <div class="attempts-counter">
        Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span> / {{ maxAttemptsPerDay }}
      </div>
    </div>

    <!-- Timer -->
    <p class="timer-line" *ngIf="attemptsRemaining <= 0 && showCardFace">
      Следующая карта через: <strong>{{ timer }}</strong>
    </p>
  </main>
</div>
```

**Ключевые изменения:**
- Удалён `*ngIf` с рубашки — она всегда в DOM, но скрыта через `backface-visibility`
- Удалён отдельный `.side.prediction` — предсказание теперь внутри `.side.face` как `.prediction-back`
- Удалён enlarged overlay полностью
- Упрощён subtitle
- Упрощён `(click)` — только `flipCard()`, без `openEnlarged`

### 2. SCSS — [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### Card wrapper — без изменений (perspective, размеры)
```scss
.card-wrapper {
  perspective: 1000px;
  width: calc(60vh * 2 / 3);
  height: 60vh;
  max-width: 90vw;
  margin: 10px auto;
  cursor: pointer;
}
```

#### Card — flip transition
```scss
.card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);

  &.flipped {
    transform: rotateY(180deg);
  }
}
```

#### Side — общий для обеих сторон
```scss
.side {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
```

#### Back (рубашка) — без изменений
```scss
.back {
  background: #1a1a1a;
  background-image: url('/assets/back/back.png');
  background-size: cover;
  background-position: center;
  border: 5px solid #555;
}
```

#### Face (лицевая сторона) — теперь содержит картинку + предсказание на обороте
```scss
.face {
  background: transparent;
  transform: rotateY(180deg);
  border: none;
  padding: 0;
  justify-content: flex-start;

  .card-image {
    width: 100%;
    height: calc(100% - 48px);
    background-color: #444;
    background-size: cover;
    background-position: center;
    border-radius: 20px 20px 0 0;
  }

  .card-name-bar {
    width: 100%;
    height: 48px;
    background: rgba(242, 242, 247, 0.94);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 0 20px 20px;

    .card-name {
      font-family: 'EBGaramond', serif;
      font-size: 1.4rem;
      color: #3C3C43;
      font-weight: 600;
    }
  }

  // Prediction on the back of the face side
  .prediction-back {
    display: none; /* Hidden by default — shown when card is flipped via CSS */
  }
}
```

#### Prediction back side — через псевдо-элемент или отдельный слой

**Важно:** Поскольку карта переворачивается как единое целое, предсказание должно быть на **обратной стороне картинки**. Самый чистый способ — сделать `.face` контейнером, который при перевороте показывает предсказание сзади.

Фактически, `.face` сам по себе — это контейнер с двумя "под-сторонами":
- Передняя: картинка + имя
- Задняя: предсказание

Но поскольку карта переворачивается целиком (rotateY(180deg)), то:
- Когда карта **не перевёрнута** (`.flipped = false`): видна `.back` (рубашка)
- Когда карта **перевёрнута** (`.flipped = true`): видна `.face`, которая сама повёрнута на 180deg

Визуально пользователь видит картинку. Предсказание — это "задняя сторона" картинки, но поскольку карта уже перевёрнута, предсказание оказывается сзади.

**Решение:** Используем `::after` псевдо-элемент на `.face` для предсказания, который появляется при наведении/дополнительном действии. **НО** по задаче — никаких дополнительных действий. Поэтому предсказание просто отображается на обратной стороне карты.

**Уточнение:** После переворота карта показывает картинку. Предсказание находится на обратной стороне карты. Если нужно увидеть предсказание — карта уже перевёрнута, и предсказание "сзади" картинки. 

**Фактическая реализация:** `.face` содержит:
1. `.card-image` + `.card-name-bar` — видимая часть (фронт)
2. `.prediction-back` — скрыта за счёт `backface-visibility` на уровне `.side`

Но поскольку `.face` уже повёрнут на 180deg (чтобы быть видимым при перевороте карты), нам нужно сделать `.prediction-back` повёрнутым ещё на 180deg, чтобы он был виден с правильной стороны.

**Проще:** Используем ту же технику, что и для основной карты — `.face` содержит два подслоя:

```scss
.face {
  // ... existing styles ...
  
  .card-front {
    // картинка + имя — видно когда карта перевёрнута
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }
  
  .prediction-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    transform: rotateY(180deg);
    background: var(--prediction-background, #2A2A2E); // очень тёмный серый, iPhone-style
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    border-radius: 20px;
    box-sizing: border-box;
    
    p {
      font-family: 'EBGaramond', serif;
      font-size: 1.4rem;
      line-height: 1.5;
      color: #EDECF9;
      text-align: center;
      margin: 0;
    }
  }
}
```

**CSS Variable для цвета фона предсказания:**
```scss
:root {
  --prediction-background: #2A2A2E; // очень тёмный серый (iOS dark gray)
}
```

Пользователь может легко изменить цвет, поменяв эту переменную.

### 3. TypeScript — [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

#### Упрощаем логику:

```typescript
export class Prediction implements OnInit, OnDestroy {
  card: Card | null = null;
  prediction: PredictionItem | null = null;
  showCardFace = false; // false = рубашка, true = перевёрнута (картинка + предсказание сзади)
  attemptsRemaining = 0;
  timer = '00:00:00';
  private timerInterval: any;
  private previousPredictionId: number | null = null;

  // Premium status
  isPremium = false;
  maxAttemptsPerDay = 1;

  // ... constructor, ngOnInit, ngOnDestroy ...

  flipCard(): void {
    // Если карта показывает рубашку — переворачиваем
    if (!this.showCardFace) {
      if (this.attemptsRemaining > 0) {
        const used = this.attemptService.useAttempt();
        if (used) {
          this.updateAttempts();
          this.addCurrentCardToCollection();
          this.showCardFace = true;
          
          // Save card data
          if (this.card && this.prediction) {
            this.attemptService.markPredictionReceived(this.card, this.prediction.text, this.prediction.id);
          }
        }
      }
    }
    // Если карта уже перевёрнута — ничего не делаем (нет enlarged)
  }

  // Удаляем: flipToFace(), flipToPrediction(), openEnlarged(), closeEnlarged()
  // Удаляем: showEnlarged, enlargedSide
  
  // showButton — показываем кнопку только когда карта не открыта
  get showButton(): boolean {
    return !this.showCardFace;
  }

  // buttonText — упрощаем
  get buttonText(): string {
    if (!this.showCardFace) {
      if (!this.isPremium && this.attemptsRemaining <= 0) {
        return 'Купить премиум';
      }
      return 'Открыть карту';
    }
    return '';
  }

  // initializeCardState — упрощаем
  private initializeCardState(): void {
    const lastData = this.attemptService.getLastCardData();
    if (lastData) {
      this.card = lastData.card;
      this.prediction = {
        id: lastData.predictionId || 1,
        text: lastData.prediction,
        cardId: lastData.card?.id || 1
      };
      this.previousPredictionId = this.prediction.id;
      this.showCardFace = true; // карта уже открыта
    } else {
      this.loadRandomCard(false);
      this.showCardFace = false; // рубашка
    }
  }
}
```

**Удалённые методы:**
- `flipToFace()` — больше не нужен, логика в `flipCard()`
- `flipToPrediction()` — больше не нужен
- `openEnlarged()` — удалён
- `closeEnlarged()` — удалён

**Удалённые свойства:**
- `showEnlarged` — больше не нужен
- `previousPredictionId` — оставляем для `drawNewCard()`

---

## Files to Modify

| File | Changes |
|------|---------|
| [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html) | Упростить до 2 сторон: рубашка + лицо (картинка спереди, предсказание сзади). Удалить enlarged overlay. |
| [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) | Добавить `.prediction-back` внутри `.face` с `backface-visibility` и `transform: rotateY(180deg)`. Добавить CSS variable `--prediction-background`. Удалить enlarged overlay styles. |
| [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts) | Упростить `flipCard()` — только один флип. Удалить `openEnlarged()`, `closeEnlarged()`, `showEnlarged`. Упростить `showButton`, `buttonText`. |

---

## Visual Flow

```
[Рубашка] → нажатие → [Карта переворачивается]
                           │
                           ├── Спереди: картинка + имя внизу
                           │
                           └── Сзади (оборот): предсказание на тёмно-сером фоне
                                (#2A2A2E, легко меняется через CSS переменную)
```

## CSS Variable for Easy Color Change

В [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) добавить:

```scss
.prediction-back {
  background: var(--prediction-bg, #2A2A2E);
  // ...
}
```

А в глобальном [`src/app/app.scss`](src/app/app.scss) или в самом компоненте:

```scss
:root {
  --prediction-bg: #2A2A2E; // очень тёмный серый, как фон iOS карточек
}
```

Чтобы изменить цвет — достаточно поменять `--prediction-bg` в одном месте.

---

## Animation

Карта использует существующий CSS transition:
```scss
transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

Это даёт красивый, плавный переворот с эффектом "пружинки" (cubic-bezier). Размеры карты не меняются, вёрстка не ломается.
