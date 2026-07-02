# Prediction Page — Double Flip Card Fix

## Problem

На странице предсказания карта имеет два состояния:
1. **Рубашка** (задняя сторона) — видна когда `showCardFace = false`
2. **Лицевая сторона** — видна когда `showCardFace = true`

Проблема в том, что на лицевой стороне `.card-front` (картинка + имя) и `.prediction-back` (текст предсказания) отображаются **одновременно**, перекрывая друг друга. Предсказание находится в DOM поверх картинки, но нет никакой анимации переворота — пользователь не может "перевернуть" карту с картинки на предсказание.

## Solution: Double Flip (Вариант A)

Добавляем третье состояние — `showPrediction`. Теперь карта будет иметь три визуальных состояния с возможностью переключаться между картинкой и предсказанием:

```
Рубашка → клик (тратит попытку) → Картинка (лицо) ↔ клик ↔ Предсказание (текст)
```

### Как это работает

1. **Исходное состояние**: `showCardFace = false`, `showPrediction = false` — видна рубашка
2. **Первый клик** (по рубашке): `flipCard()` → тратит попытку, устанавливает `showCardFace = true` — карта переворачивается, показывая картинку + имя
3. **Второй клик** (по картинке): `flipCard()` → видит что `showCardFace = true` и `showPrediction = false` → устанавливает `showPrediction = true` — внутренняя часть карты переворачивается, показывая предсказание
4. **Третий клик** (по предсказанию): `flipCard()` → видит что `showPrediction = true` → устанавливает `showPrediction = false` — возвращается к картинке
5. **Четвёртый клик** (по картинке): снова переключается на предсказание — и так далее

### Визуальная структура

```
┌──────────────────────────────┐
│         Card Container       │
│  ┌────────────────────────┐  │
│  │     .side.back         │  │  ← Рубашка (showCardFace = false)
│  │   (рубашка с узором)   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │     .side.face         │  │  ← Лицевая сторона (showCardFace = true)
│  │  ┌──────────────────┐  │  │
│  │  │  .card-front     │  │  │  ← Картинка + имя (showPrediction = false)
│  │  │  (картинка/имя)  │  │  │
│  │  └──────────────────┘  │  │
│  │  ┌──────────────────┐  │  │
│  │  │ .prediction-back │  │  │  ← Предсказание (showPrediction = true)
│  │  │  (текст)         │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Changes

### 1. TypeScript — [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts)

#### Add new property:
```typescript
showPrediction = false; // false = картинка, true = предсказание
```

#### Modify `flipCard()`:
```typescript
flipCard(): void {
  if (!this.showCardFace) {
    // State 1: Рубашка → переворачиваем на картинку (тратим попытку)
    if (this.attemptsRemaining > 0) {
      const used = this.attemptService.useAttempt();
      if (used) {
        this.updateAttempts();
        this.addCurrentCardToCollection();
        this.showCardFace = true;
        this.showPrediction = false; // явно сбрасываем
        if (this.card && this.prediction) {
          this.attemptService.markPredictionReceived(this.card, this.prediction.text, this.prediction.id);
        }
      }
    }
  } else {
    // State 2/3: Карта уже открыта — переключаем между картинкой и предсказанием
    this.showPrediction = !this.showPrediction;
  }
}
```

#### Modify `initializeCardState()`:
```typescript
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
    this.showCardFace = true;
    this.showPrediction = false; // Показываем картинку, а не предсказание
  } else {
    this.loadRandomCard(false);
    this.showCardFace = false;
    this.showPrediction = false;
  }
}
```

#### Modify `drawNewCard()`:
```typescript
drawNewCard(): void {
  if (this.attemptsRemaining > 0) {
    const used = this.attemptService.useAttempt();
    if (used) {
      this.updateAttempts();
      this.attemptService.resetPredictionReceived();
      this.loadRandomCard(true, true);
      this.showCardFace = false;
      this.showPrediction = false; // сбрасываем
    }
  }
}
```

#### Modify `purchasePremium()`:
```typescript
purchasePremium(): void {
  // ... existing code ...
  this.loadRandomCard(false);
  this.showCardFace = false;
  this.showPrediction = false; // сбрасываем
}
```

### 2. HTML — [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html)

Добавляем второй слой флипа внутри `.face`:

```html
<div class="card-wrapper" (click)="flipCard()">
  <div class="card" [class.flipped]="showCardFace">
    <!-- Back side (рубашка) -->
    <div class="side back"></div>

    <!-- Face side — теперь с внутренним флипом -->
    <div class="side face">
      <div class="card-inner" [class.show-prediction]="showPrediction">
        <!-- Front: картинка + имя -->
        <div class="card-front">
          <div class="card-image" [style.backgroundImage]="'url(' + card?.imageUrl + ')'"></div>
          <div class="card-name-bar">
            <span class="card-name">{{ card?.name }}</span>
          </div>
        </div>

        <!-- Back: предсказание -->
        <div class="prediction-back">
          <p>{{ prediction?.text }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Ключевое изменение:** Добавлен `.card-inner` — контейнер с `transform-style: preserve-3d`, который делает внутренний флип между `.card-front` и `.prediction-back`.

### 3. SCSS — [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss)

#### Добавить стили для `.card-inner`:

```scss
.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 20px;

  &.show-prediction {
    transform: rotateY(180deg);
  }
}
```

#### Изменить `.card-front`:
```scss
.card-front {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
  // ... остальные стили (card-image, card-name-bar) остаются
}
```

#### Изменить `.prediction-back`:
```scss
.prediction-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transform: rotateY(180deg);
  background: var(--prediction-bg, #2A2A2E);
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
```

#### Удалить старые стили `.face` которые конфликтуют:
- Удалить `justify-content: flex-start` из `.face` (теперь `.card-inner` управляет расположением)
- `.face` больше не содержит прямых дочерних элементов `.card-image` и `.card-name-bar` — они внутри `.card-front`

### 4. Subtitle text

Обновить текст подсказки в HTML:
```html
<p class="subtitle">
  {{ showCardFace ? (showPrediction ? '' : 'Нажмите на карту, чтобы узнать предсказание') : 'Нажмите на карту, чтобы открыть её' }}
</p>
```

## Files to Modify

| File | Changes |
|------|---------|
| [`src/app/pages/prediction/prediction.ts`](src/app/pages/prediction/prediction.ts) | Add `showPrediction` property. Modify `flipCard()`, `initializeCardState()`, `drawNewCard()`, `purchasePremium()` |
| [`src/app/pages/prediction/prediction.html`](src/app/pages/prediction/prediction.html) | Add `.card-inner` wrapper with inner flip. Update subtitle text |
| [`src/app/pages/prediction/prediction.scss`](src/app/pages/prediction/prediction.scss) | Add `.card-inner` styles. Refactor `.card-front` and `.prediction-back` as inner flip layers |

## Visual Flow

```
┌─────────┐     клик      ┌──────────────────┐     клик      ┌──────────────────┐
│         │  (тратит      │                  │──────────────►│                  │
│ Рубашка │   попытку)    │  Картинка + имя  │               │  Предсказание    │
│         │──────────────►│                  │◄──────────────│  (текст)         │
│         │               │                  │     клик      │                  │
└─────────┘               └──────────────────┘               └──────────────────┘
```

Пользователь может свободно переключаться между картинкой и предсказанием кликами.

## Edge Cases

1. **Возврат на страницу**: `initializeCardState()` устанавливает `showCardFace = true`, `showPrediction = false` — показывается картинка, а не предсказание
2. **Новая карта**: `drawNewCard()` сбрасывает оба флага — начинаем с рубашки
3. **Покупка премиума**: сбрасывает оба флага — начинаем с рубашки
4. **Переключение туда-обратно**: клик по картинке → предсказание, клик по предсказанию → картинка, и так далее
5. **Сохранение данных**: `markPredictionReceived()` сохраняет данные карты и предсказания — не меняется

## Verification

- [ ] Первый клик по рубашке: карта переворачивается, показывая картинку + имя
- [ ] Второй клик по картинке: внутренняя часть карты переворачивается, показывая предсказание
- [ ] Третий клик по предсказанию: возвращается к картинке
- [ ] Четвёртый клик по картинке: снова показывает предсказание
- [ ] После возврата на страницу: показывается картинка (не предсказание)
- [ ] После "Новой карты": начинаем с рубашки
- [ ] Анимация флипа плавная, CSS transition работает
- [ ] Кнопка "Открыть карту" и счётчик попыток работают корректно
- [ ] Таймер обратного отсчёта работает корректно
