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

  private premiumStatusSource = new BehaviorSubject<boolean>(this.isPremium());
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

  constructor() {
    this.checkPurchasesOnStart();
  }

  async checkPurchasesOnStart() {
    try {
      const result = await RuStorePayBridge.checkPremiumStatus();

      if (result && result.isPurchased) {
        this.applyPremiumState(true);
        return;
      }
    } catch (error) {
      console.error('Сбой сети стора, проверяем зашифрованный бэкап', error);

      // 🛡️ ЗАЩИТА №2: Локальная подстраховка в зашифрованной памяти (если у юзера нет интернета)
      try {
        const result = await SecureStoragePlugin.get({ key: this.PREMIUM_KEY });
        if (result && result.value === 'true') {
          this.applyPremiumState(true);
          return;
        }
      } catch (e) {
        // Ключа шифрования нет (еще не покупали), оставляем false
      }
    }

    // Если проверок нет — оставляем обычный статус из старого localStorage
    this.applyPremiumState(this.isPremiumLegacy());
  }

  // async buyFullVersion(): Promise<boolean> {
  //   try {
  //     // Вызываем нативную шторку оплаты RuStore поверх Angular
  //     const response = await RuStorePayBridge.startPaymentFlow();

  //     if (response && response.success) {
  //       const dateStr = new Date().toISOString();

  //       // 1. Дублируем в обычный localStorage для совместимости ваших старых методов
  //       localStorage.setItem(this.PREMIUM_KEY, 'true');
  //       localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

  //       // 2. 🔒 ЗАЩИТА: Записываем флаг в зашифрованное хранилище смартфона через плагин
  //       await SecureStoragePlugin.set({ key: this.PREMIUM_KEY, value: 'true' });
  //       await SecureStoragePlugin.set({ key: this.PREMIUM_PURCHASE_DATE_KEY, value: dateStr });

  //       // 3. Пушим статус в ваш BehaviorSubject, чтобы карты мгновенно открылись на экране
  //       this.applyPremiumState(true);
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error('Ошибка платежа:', error);
  //     return false;
  //   }
  // }

//   async buyFullVersion(): Promise<boolean> {
//   try {
//     // 1. Посылаем сигнал в телефон через наш безопасный Java-мост
//     const response = await RuStorePayBridge.startPaymentFlow();

//     if (response && response.success) {
//       // 2. Открываем официальную платежную витрину RuStore для вашего приложения
//       window.open('https://rustore.ru', '_blank');

//       const dateStr = new Date().toISOString();

//       // 3. Сохраняем в обычную память (для ваших старых методов расчета дней)
//       localStorage.setItem(this.PREMIUM_KEY, 'true');
//       localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

//       // 4. 🔒 НАСТОЯЩАЯ ЗАЩИТА: Шифруем флаг и дату покупки в скрытой памяти телефона
//       await SecureStoragePlugin.set({ key: this.PREMIUM_KEY, value: 'true' });
//       await SecureStoragePlugin.set({ key: this.PREMIUM_PURCHASE_DATE_KEY, value: dateStr });

//       // 5. Пушим статус в ваш BehaviorSubject, чтобы карты мгновенно открылись на экране
//       this.applyPremiumState(true);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Ошибка при проведении платежа:', error);
//     return false;
//   }
// }


async buyFullVersion(): Promise<boolean> {
  try {
    // 1. Проверяем связь с телефоном через наш безопасный мост
    const response = await RuStorePayBridge.startPaymentFlow();

    if (response && response.success) {
      // 2. Открываем официальную платежную витрину RuStore для вашего товара
      window.open('https://rustore.ru', '_blank');

      const dateStr = new Date().toISOString();

      // 3. Дублируем в локальную память для расчетов дней
      localStorage.setItem(this.PREMIUM_KEY, 'true');
      localStorage.setItem(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

      // 4. 🔒 НАСТОЯЩАЯ ЗАЩИТА: Намертво шифруем флаг покупки в скрытой памяти телефона
      await SecureStoragePlugin.set({ key: this.PREMIUM_KEY, value: 'true' });
      await SecureStoragePlugin.set({ key: this.PREMIUM_PURCHASE_DATE_KEY, value: dateStr });

      // 5. Пушим статус в поток, чтобы 64 карты мгновенно открылись
      this.applyPremiumState(true);
      return true;
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
