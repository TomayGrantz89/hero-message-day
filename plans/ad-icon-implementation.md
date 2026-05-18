# План реализации значка рекламы в счетчике попыток

## Цель
Добавить значок рекламы 🎬 в счетчик попыток, чтобы пользователю было заметно, что есть еще одна попытка через просмотр рекламы. Значок должен появляться только при 0 попытках и когда реклама доступна для просмотра.

## Текущее состояние
1. В `prediction.html` блок с попытками:
   ```html
   <div class="attempts">
     Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span>
   </div>
   ```

2. В `prediction.ts`:
   - Свойство `attemptsRemaining` отслеживает оставшиеся попытки
   - Метод `updateAttempts()` обновляет значение
   - Сервис `attemptService` предоставляет метод `canWatchAd()`

3. В `prediction.scss` стили для `.attempts` и `.attempt-count`

## Необходимые изменения

### 1. Изменения в HTML (`src/app/pages/prediction/prediction.html`)
```html
<div class="attempts">
  Осталось попыток: <span class="attempt-count">{{ attemptsRemaining }}</span>
  <span class="ad-icon" 
        *ngIf="attemptsRemaining === 0 && attemptService.canWatchAd()"
        title="Получить ещё попытку через просмотр рекламы">
    🎬
  </span>
</div>
```

### 2. Изменения в TypeScript (`src/app/pages/prediction/prediction.ts`)
Дополнительных изменений в логике не требуется, так как условия отображения уже доступны:
- `attemptsRemaining === 0` - когда попытки закончились
- `attemptService.canWatchAd()` - когда реклама еще не просмотрена сегодня

### 3. Изменения в CSS (`src/app/pages/prediction/prediction.scss`)
Добавить стили для класса `.ad-icon`:
```scss
.ad-icon {
  display: inline-block;
  margin-left: 10px;
  font-size: 1.5rem;
  cursor: pointer;
  animation: pulse 2s infinite;
  vertical-align: middle;
  transition: transform 0.3s;
  
  &:hover {
    transform: scale(1.2);
  }
}

@keyframes pulse {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
}
```

Также обновить существующие стили `.attempts` для правильного расположения:
```scss
.attempts {
  font-size: 1.3rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .attempt-count {
    font-weight: bold;
    color: #00ffaa;
    font-size: 1.8rem;
  }
}
```

### 4. Дополнительные улучшения (опционально)
1. **Клик по иконке** - можно сделать так, чтобы при клике на иконку открывалось модальное окно с рекламой:
   ```html
   <span class="ad-icon" 
         *ngIf="attemptsRemaining === 0 && attemptService.canWatchAd()"
         title="Получить ещё попытку через просмотр рекламы"
         (click)="showAdModal = true">
     🎬
   </span>
   ```

2. **Тултип при наведении** - уже добавлен через атрибут `title`

3. **Альтернативные иконки** - можно использовать SVG или Font Awesome вместо эмодзи

## Порядок выполнения
1. Создать backup текущих файлов
2. Внести изменения в HTML
3. Внести изменения в SCSS
4. Протестировать отображение при разных состояниях:
   - Попытки > 0 - иконка не отображается
   - Попытки = 0, реклама доступна - иконка отображается с анимацией
   - Попытки = 0, реклама уже просмотрена - иконка не отображается
5. Проверить адаптивность на мобильных устройствах

## Ожидаемый результат
Пользователь видит анимированную иконку 🎬 рядом с счетчиком попыток, когда попытки закончились, но еще можно посмотреть рекламу для получения дополнительной попытки. Это делает возможность получения попытки через рекламу более заметной и интуитивно понятной.
