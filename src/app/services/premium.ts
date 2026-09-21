import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';

const RuStorePayBridge = (Capacitor as any).Plugins.RuStorePayBridge;

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';
  private readonly PREMIUM_PRODUCT_ID = 'gh777';

  /**
   * Единый источник правды в памяти.
   * Синхронные потребители (attempt-система, карточки, страницы) вызывают
   * isPremium() и должны видеть то же состояние, что и UI.
   * Инициализируется из localStorage, затем обновляется через applyPremiumState()
   * по результатам проверки SecureStorage / стора при старте.
   */
  private currentPremium: boolean = localStorage.getItem(this.PREMIUM_KEY) === 'true';

  private premiumStatusSource = new BehaviorSubject<boolean>(this.currentPremium);
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

  constructor(private storage: StorageService) {
    this.checkPurchasesOnStart();
  }

  /**
   * Автовосстановление при старте.
   * Порядок проверок:
   *  1. Зашифрованный бэкап (SecureStorage) — мгновенно, переживает очистку кэша.
   *  2. Стор (RuStore) — авторитетный источник.
   *  3. Старый localStorage — для совместимости.
   *
   * Любое подтверждение премиума через applyPremiumState(true) ОБЯЗАТЕЛЬНО
   * синхронизирует флаг в localStorage (+ нативный бэкап), чтобы синхронные
   * проверки isPremium() (например, attempt-система вопросов к оракулу)
   * считали пользователя премиумом с неограниченными вопросами.
   */
  async checkPurchasesOnStart() {
    console.log('[DBG-P] checkPurchasesOnStart START: currentPremium=', this.currentPremium,
      '| localStorage PREMIUM_KEY=', localStorage.getItem(this.PREMIUM_KEY));
    // 1. Сначала локальный зашифрованный бэкап — мгновенно восстанавливает премиум
    //    и убирает «мигание» не-премиум состояния при старте.
    try {
      const backup = await SecureStoragePlugin.get({ key: this.PREMIUM_KEY });
      if (backup && backup.value === 'true') {
        console.log('[DBG-P] SecureStorage backup=true -> applyPremiumState(true)');
        this.applyPremiumState(true);
      }
    } catch (e) {
      // Ключа шифрования нет (ещё не покупали) — продолжаем
    }

    // 2. Авторитетная проверка в сторе
    try {
      const result = await RuStorePayBridge.checkPremiumStatus();

      if (result && result.isPurchased) {
        console.log('[DBG-P] Store check isPurchased=true -> applyPremiumState(true)');
        this.applyPremiumState(true);
        return;
      }
    } catch (error) {
      console.error('Сбой сети стора, полагаемся на локальный бэкап', error);
    }

    // 3. Если стор вернул false или упал — оставляем состояние из локального бэкапа
    //    (SecureStorage уже проверен выше и синхронизирован в localStorage)
    //    или из старого localStorage.
    console.log('[DBG-P] checkPurchasesOnStart fallback: isPremiumLegacy()=',
      this.isPremiumLegacy());
    this.applyPremiumState(this.isPremiumLegacy());
  }

  /**
   * Восстановление покупок вручную (кнопка в магазине).
   * Использует тот же механизм, что и автовосстановление при старте.
   */
  async restorePurchases(): Promise<boolean> {
    // 1. Локальный зашифрованный бэкап
    try {
      const backup = await SecureStoragePlugin.get({ key: this.PREMIUM_KEY });
      if (backup && backup.value === 'true') {
        this.applyPremiumState(true);
        return true;
      }
    } catch (e) {
      // нет ключа
    }

    // 2. Авторитетная проверка в сторе
    try {
      const result = await RuStorePayBridge.checkPremiumStatus();

      if (result && result.isPurchased) {
        this.applyPremiumState(true);
        return true;
      }
    } catch (error) {
      console.error('Сбой сети стора при восстановлении', error);
    }

    // 3. Старый localStorage
    if (this.isPremiumLegacy()) {
      this.applyPremiumState(true);
      return true;
    }

    return false;
  }

  async buyFullVersion(): Promise<boolean> {
    try {
      // Вызываем нативную шторку оплаты RuStore с ID товара
      const response = await RuStorePayBridge.startPaymentFlow({
        productId: this.PREMIUM_PRODUCT_ID,
      });

      if (response && response.success) {
        const dateStr = new Date().toISOString();

        // 1. Дублируем в локальную память для расчётов дней
        //    (StorageService.set дополнительно пишет нативный бэкап, чтобы флаг
        //    пережил очистку кэша и был восстановлен restoreAll() при старте)
        this.storage.set(this.PREMIUM_KEY, 'true');
        this.storage.set(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

        // 2. 🔒 НАСТОЯЩАЯ ЗАЩИТА: Намертво шифруем флаг покупки в скрытой памяти телефона
        await SecureStoragePlugin.set({ key: this.PREMIUM_KEY, value: 'true' });
        await SecureStoragePlugin.set({ key: this.PREMIUM_PURCHASE_DATE_KEY, value: dateStr });

        // 3. Пушим статус в поток, чтобы 64 карты мгновенно открылись
        this.applyPremiumState(true);
        return true;
      }

      if (response && response.cancelled) {
        console.log('Покупка отменена пользователем');
      } else {
        console.error('Ошибка платежа:', response?.error || 'Неизвестная ошибка');
      }

      return false;
    } catch (error) {
      console.error('Ошибка платежа:', error);
      return false;
    }
  }

  /**
   * Check if user has premium access.
   * Единый источник правды — in-memory флаг (обновляется через applyPremiumState),
   * с фолбэком на localStorage на случай внешних записей (savePurchaseStatus и т.п.).
   */
  isPremium(): boolean {
    return this.currentPremium || localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  private isPremiumLegacy(): boolean {
    return localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  /**
   * Единственная точка изменения премиум-статуса:
   *  - обновляет in-memory флаг (единый источник правды),
   *  - синхронизирует localStorage + нативный бэкап (переживает очистку кэша),
   *  - пушит статус в реактивный поток для UI.
   */
  private applyPremiumState(status: boolean) {
    this.currentPremium = status;
    if (status) {
      this.storage.set(this.PREMIUM_KEY, 'true');
    } else {
      this.storage.remove(this.PREMIUM_KEY);
    }
    this.premiumStatusSource.next(status);
  }

  /**
   * Activate premium access (simulate purchase)
   */
  activatePremium(): void {
    const dateStr = new Date().toISOString();
    this.storage.set(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);
    // Premium users have unlimited questions — no need to set a fixed count
    this.applyPremiumState(true);
  }

  /**
   * Deactivate premium access (for testing or refund scenarios)
   */
  deactivatePremium(): void {
    this.storage.remove(this.PREMIUM_PURCHASE_DATE_KEY);
    this.applyPremiumState(false);
  }

  /**
   * Get purchase date if available
   */
  getPurchaseDate(): Date | null {
    const dateStr = localStorage.getItem(this.PREMIUM_PURCHASE_DATE_KEY);
    return dateStr ? new Date(dateStr) : null;
  }

  /**
   * Get days since purchase
   */
  getDaysSincePurchase(): number | null {
    const purchaseDate = this.getPurchaseDate();
    if (!purchaseDate) return null;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get premium status for display
   */
  getStatus(): { isPremium: boolean; purchaseDate: Date | null; daysSince: number | null } {
    return {
      isPremium: this.isPremium(),
      purchaseDate: this.getPurchaseDate(),
      daysSince: this.getDaysSincePurchase()
    };
  }
}
