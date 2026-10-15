import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { VkBridgeService } from './vk-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class Premium {
  private readonly PREMIUM_KEY = 'cardGamePremiumStatus';
  private readonly PREMIUM_PURCHASE_DATE_KEY = 'cardGamePremiumPurchaseDate';

  /**
   * ID товара в кабинете разработчика VK Mini Apps.
   * Указывается при настройке VK Payments (тип товара «item»).
   */
  private readonly PREMIUM_PRODUCT_ID = 'gh777';

  /**
   * Единый источник правды в памяти.
   * Синхронные потребители (attempt-система, карточки, страницы) вызывают
   * isPremium() и должны видеть то же состояние, что и UI.
   */
  private currentPremium: boolean =
    localStorage.getItem(this.PREMIUM_KEY) === 'true';

  private premiumStatusSource = new BehaviorSubject<boolean>(this.currentPremium);
  premiumStatus$: Observable<boolean> = this.premiumStatusSource.asObservable();

  constructor(
    private storage: StorageService,
    private vk: VkBridgeService
  ) {
    this.checkPurchasesOnStart();
  }

  /**
   * Проверка статуса покупки при старте.
   * Порядок:
   *  1. localStorage (мгновенно) — состояние, сохранённое ранее;
   *  2. облачное зеркало VK Storage (восстанавливается в restoreAll());
   *  3. авторитетная проверка истории заказов VK (VKWebAppGetOrders).
   */
  async checkPurchasesOnStart(): Promise<void> {
    try {
      const orders = await this.vk.getOrders();
      if (orders.some((o) => o.item === this.PREMIUM_PRODUCT_ID)) {
        this.applyPremiumState(true);
        return;
      }
    } catch (e) {
      console.warn('[Premium] Проверка заказов VK не удалась:', e);
    }
    // Фолбэк — локальное состояние
    this.applyPremiumState(this.isPremiumLegacy());
  }

  /**
   * Ручное восстановление покупки (кнопка в магазине).
   */
  async restorePurchases(): Promise<boolean> {
    // 1. Локальный флаг
    if (this.isPremiumLegacy()) {
      this.applyPremiumState(true);
      return true;
    }

    // 2. Авторитетная проверка истории заказов VK
    try {
      const orders = await this.vk.getOrders();
      if (orders.some((o) => o.item === this.PREMIUM_PRODUCT_ID)) {
        this.applyPremiumState(true);
        return true;
      }
    } catch (e) {
      console.warn('[Premium] Ошибка VKWebAppGetOrders:', e);
    }

    return false;
  }

  /**
   * Покупка полной версии через VK Payments.
   */
  async buyFullVersion(): Promise<boolean> {
    const success = await this.vk.showOrderBox(this.PREMIUM_PRODUCT_ID);

    if (!success) {
      console.log('Покупка отменена или завершилась ошибкой');
      return false;
    }

    const dateStr = new Date().toISOString();
    // Локально для расчётов дней и мгновенной разблокировки
    this.storage.set(this.PREMIUM_KEY, 'true');
    this.storage.set(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);

    // Пушим статус в поток, чтобы 64 карты мгновенно открылись
    this.applyPremiumState(true);
    return true;
  }

  /**
   * Check if user has premium access.
   * Единый источник правды — in-memory флаг, с фолбэком на localStorage.
   */
  isPremium(): boolean {
    return this.currentPremium || localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  private isPremiumLegacy(): boolean {
    return localStorage.getItem(this.PREMIUM_KEY) === 'true';
  }

  /**
   * Единственная точка изменения премиум-статуса:
   * обновляет in-memory флаг, синхронизирует localStorage (+ облако VK),
   * пушит статус в реактивный поток для UI.
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
   * Activate premium access (для тестирования / бесплатных промо)
   */
  activatePremium(): void {
    const dateStr = new Date().toISOString();
    this.storage.set(this.PREMIUM_PURCHASE_DATE_KEY, dateStr);
    this.applyPremiumState(true);
  }

  /**
   * Deactivate premium access (для тестирования)
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
  getStatus(): {
    isPremium: boolean;
    purchaseDate: Date | null;
    daysSince: number | null;
  } {
    return {
      isPremium: this.isPremium(),
      purchaseDate: this.getPurchaseDate(),
      daysSince: this.getDaysSincePurchase(),
    };
  }
}
