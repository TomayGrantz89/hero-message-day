# RuStore Pay SDK Integration — План Исправлений

## Контекст

- **Тип покупки:** Непотребляемый товар (one-time non-consumable) — премиум навсегда
- **Product ID:** `premium_unlock` (нужно создать в консоли RuStore)
- **Серверная проверка:** Нет, только клиентская (localStorage + SecureStoragePlugin)
- **Товар в консоли:** Ещё не создан

---

## Текущие проблемы (8 штук)

| # | Файл | Проблема | Важность |
|---|------|----------|----------|
| 1 | `MainActivity.java` | Самодельный плагин-заглушка вместо реального SDK | 🔴 |
| 2 | `AndroidManifest.xml` | Нет deeplink конфигурации (sdk_pay_scheme_value, intent-filter) | 🔴 |
| 3 | `AndroidManifest.xml` | Неправильное имя meta-data для console_app_id | 🔴 |
| 4 | `premium.ts` | Нет productId при вызове покупки | 🔴 |
| 5 | `premium.ts` | Лишний `window.open('https://rustore.ru')` после оплаты | 🟡 |
| 6 | `strings.xml` | Плейсхолдеры `com.example.myapp` вместо реального package name | 🟡 |
| 7 | `build.gradle` | BOM версия `2026.06.01` вместо актуальной `2026.07.01` | 🟢 |
| 8 | RuStore Console | Товар `premium_unlock` ещё не создан | 🔴 |

---

## Пошаговый план исправлений

### Шаг 1: Исправить `strings.xml`

**Файл:** [`android/app/src/main/res/values/strings.xml`](android/app/src/main/res/values/strings.xml)

Поменять плейсхолдеры и добавить ресурсы для RuStore:

```xml
<string name="package_name">com.goldenhare.cardapp</string>
<string name="custom_url_scheme">com.goldenhare.cardapp</string>
<string name="CONSOLE_APPLICATION_ID">2063735659</string>
<string name="APP_SCHEME">com.goldenhare.cardapp.rustore.scheme</string>
```

---

### Шаг 2: Исправить `AndroidManifest.xml`

**Файл:** [`android/app/src/main/AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml)

1. Исправить meta-data для console_app_id:
   - Было: `android:name="ru.rustore.sdk.pay.console_app_id"`
   - Стало: `android:name="console_app_id_value"`

2. Добавить meta-data для deeplink scheme

3. Добавить `android:launchMode="singleTop"` на MainActivity

4. Добавить intent-filter для deeplink

---

### Шаг 3: Переписать `MainActivity.java`

**Файл:** [`android/app/src/main/java/com/goldenhare/cardapp/MainActivity.java`](android/app/src/main/java/com/goldenhare/cardapp/MainActivity.java)

Полностью заменить текущий код на правильную интеграцию с `RuStorePayClient`:

**3.1. Инициализация SDK** — автоматическая, но нужно:
- Добавить `onNewIntent()` для обработки deeplink
- Вызвать `intentInteractor.proceedIntent()` в `onCreate()` и `onNewIntent()`

**3.2. Метод `checkPremiumStatus(productId)`**:
- Вызвать `RuStorePayClient.getInstance().getPurchaseInteractor().getPurchases()`
- Отфильтровать по `productId = "premium_unlock"`
- Проверить статус: `PAID` или `CONFIRMED`
- Вернуть `isPurchased: true/false`

**3.3. Метод `startPaymentFlow(productId)`**:
- Создать `ProductPurchaseParams(productId = "premium_unlock")`
- Вызвать `purchase(params, ONE_STEP, LIGHT)`
- В `onSuccessListener` вернуть `{ success: true, purchaseId: ... }`
- В `onFailureListener` обработать `ProductPurchaseException` и `ProductPurchaseCancelled`

---

### Шаг 4: Исправить `premium.ts`

**Файл:** [`src/app/services/premium.ts`](src/app/services/premium.ts)

1. Убрать `window.open('https://rustore.ru', '_blank')` — строка 114
2. Передавать `productId = "premium_unlock"` в вызов `startPaymentFlow`
3. Обрабатывать ответ с `purchaseId` для дополнительной верификации
4. После успешной покупки вызывать `updateAcknowledgementState` для подтверждения выдачи товара

---

### Шаг 5: Обновить BOM версию в `build.gradle`

**Файл:** [`android/app/build.gradle`](android/app/build.gradle)

```gradle
implementation(platform("ru.rustore.sdk:bom:2026.07.01"))
```

---

### Шаг 6: Создать товар в RuStore Console

Действие в консоли, не в коде:
1. Зайти в [RuStore Console](https://console.rustore.ru)
2. Выбрать приложение → **Монетизация**
3. Создать **непотребляемый товар**:
   - Product ID: `premium_unlock`
   - Название: "Премиум-доступ"
   - Описание: "Полный доступ ко всем 64 картам и неограниченные вопросы оракулу"
   - Цена: установить желаемую

---

## Что НЕ меняется

- **Логика премиума в Angular** (`isPremium()`, `premiumStatus$`, `activatePremium()`, `deactivatePremium()`) — остаётся как есть
- **UI компоненты** (bottom-bar, collection, prediction, question) — не меняются, они уже правильно подписываются на `premiumStatus$`
- **SecureStoragePlugin** — остаётся как дополнительная защита
- **localStorage** — остаётся для совместимости

---

## Диаграмма: как будет работать после исправлений

```
[Пользователь нажимает "Купить премиум"]
         │
         ▼
┌─────────────────────────┐
│  bottom-bar.ts           │
│  purchasePremium()       │
│    await                 │
│  premium.buyFullVersion()│
└─────────┬───────────────┘
          │ Capacitor JS Bridge
          ▼
┌─────────────────────────────────┐
│  MainActivity.java               │
│  startPaymentFlow("premium_unlock")│
│    ┌─────────────────────────┐   │
│    │ purchase(params)        │───┼──► RuStore Pay SDK
│    │ ONE_STEP, LIGHT theme   │   │       │
│    └─────────────────────────┘   │       │ (показывает шторку оплаты)
│                                  │       ▼
│    ┌─────────────────────────┐   │  [Пользователь платит]
│    │ onSuccess:              │◄──┼─── success/fail
│    │   { success: true }     │   │
│    └─────────────────────────┘   │
└─────────┬───────────────────────┘
          │ Capacitor JS Bridge
          ▼
┌─────────────────────────┐
│  premium.ts              │
│  buyFullVersion()        │
│    → success = true      │
│    → SecureStorage set   │
│    → localStorage set    │
│    → applyPremiumState() │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Все UI компоненты       │
│  получают isPremium=true │
│  через premiumStatus$    │
└─────────────────────────┘
```

---

## Todo List для реализации

- [ ] Исправить `strings.xml` — правильный package name + RuStore ресурсы
- [ ] Исправить `AndroidManifest.xml` — meta-data, deeplink, singleTop
- [ ] Переписать `MainActivity.java` — реальная интеграция с RuStorePayClient
- [ ] Исправить `premium.ts` — убрать window.open, добавить productId
- [ ] Обновить BOM в `build.gradle` до `2026.07.01`
- [ ] Создать товар `premium_unlock` в RuStore Console (вручную)
