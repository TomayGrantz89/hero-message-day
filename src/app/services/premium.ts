import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Capacitor } from '@capacitor/core';

const RuStorePayBridge = (Capacitor as any).Plugins.RuStorePayBridge;

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';
  private readonly PREMIUM_PRODUCT_ID = 'premium_unlock';

  private premiumStatusSource = new BehaviorSubject<boolean>(false);
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

  constructor() {
    this.checkPurchasesOnStart();
  }

  /**
   * Автовосстановление при старте.
   * Порядок проверок:
   *  1. Зашифрованный бэкап (SecureStorage) — мгновенно, переживает очистку кэша.
   *  2. Стор (RuStore) — авторитетный источник.
   *  3. Старый localStorage — для совместимости.
   */
  async checkPurchasesOnStart() {
    // 1. Сначала локальный зашифрованный бэкап — мгновенно восстанавливает премиум
    //    и убирает «мигание» не-премиум состояния при старте.
    try {
      const backup = await SecureStoragePlugin.get({ key: this.PREMIUM_KEY });
      if (backup && backup.value === 'true') {
        this.applyPremiumState(true);
      }
    } catch (e) {
      // Ключа шифрования нет (ещё не покупали) — продолжаем
    }

    // 2. Авторитетная проверка в сторе
    try {
      const result = await RuStorePayBridge.checkPremiumStatus();

      if (result && result.isPurchased) {
        this.applyPremiumState(true);
        return;
      }
    } catch (error) {
      console.error('Сбой сети стора, полагаемся на локальный бэкап', error);
    }

    // 3. Если стор вернул false или упал — оставляем состояние из локального бэкапа
    //    (SecureStorage уже проверен выше) или из старого localStorage.
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
        localStorage.setItem(this.PREMIUM_KEY, 'true');
        localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

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
   * Check if user has premium access
   */
  isPremium(): boolean {
    return localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  private isPremiumLegacy(): boolean {
    return localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  private applyPremiumState(status: boolean) {
    this.premiumStatusSource.next(status);
  }

  /**
   * Activate premium access (simulate purchase)
   */
  activatePremium(): void {
    localStorage.setItem(this.PREMIUM_KEY, 'true');
    localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, new Date().toISOString());
    // Premium users have unlimited questions — no need to set a fixed count
    this.premiumStatusSource.next(true);
  }

  /**
   * Deactivate premium access (for testing or refund scenarios)
   */
  deactivatePremium(): void {
    localStorage.removeItem(this.PREMIUM_KEY);
    localStorage.removeItem(this.PREMIUM_PURCHASE_DATE_KEY);
    this.premiumStatusSource.next(false);
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
