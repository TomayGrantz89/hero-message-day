import { Injectable } from '@angular/core';
import bridge from '@vkontakte/vk-bridge';

export type VKTheme = 'light' | 'dark';

export interface VKUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
  photo_200?: string;
  sex?: number;
}

export interface VKOrder {
  transaction_id: string;
  item: string;
  amount: string;
  date: number;
}

/**
 * Единая точка интеграции с платформой VK Mini Apps.
 *
 * Отвечает за:
 *  - инициализацию VK Bridge (VKWebAppInit);
 *  - определение окружения (работаем ли внутри VK webview);
 *  - тему (VKWebAppUpdateConfig) — светлая/тёмная, применяется через
 *    CSS-классы `vk-light` / `vk-dark` на <body>;
 *  - данные пользователя (VKWebAppGetUserInfo);
 *  - облачное хранилище VK (VKWebAppStorage*) — фоновое зеркалирование;
 *  - платежи VK Pay (VKWebAppShowOrderBox / VKWebAppGetOrders).
 *
 * Все методы безопасны вне VK (обычный браузер): они тихо возвращают
 * значения по умолчанию, не бросая исключений.
 */
@Injectable({
  providedIn: 'root',
})
export class VkBridgeService {
  private _isVK = false;
  private _theme: VKTheme = 'light';
  private initialized = false;

  /** true, если приложение запущено внутри клиента VK */
  get isVK(): boolean {
    return this._isVK;
  }

  /** Текущая тема платформы */
  get theme(): VKTheme {
    return this._theme;
  }

  constructor() {
    this._isVK = this.detectVK();
  }

  private detectVK(): boolean {
    try {
      // vk-bridge сам определяет, находится ли скрипт в webview VK
      return bridge.isWebView();
    } catch {
      return false;
    }
  }

  /**
   * Инициализирует VK Bridge и подписывается на обновление темы.
   * Вызывается один раз при старте приложения.
   */
  async init(): Promise<void> {
    if (!this._isVK || this.initialized) {
      return;
    }
    this.initialized = true;

    try {
      await bridge.send('VKWebAppInit', {});
    } catch (e) {
      console.warn('[VK] VKWebAppInit failed:', e);
    }

    // Тема приходит событием VKWebAppUpdateConfig сразу после инициализации
    bridge.subscribe((event) => {
      const type = event?.detail?.type;
      if (type === 'VKWebAppUpdateConfig') {
        const data = (event.detail as any).data || {};
        this.applyScheme(data.scheme);
      }
    });

    // Для мобильных клиентов — цвет системного статус-бара
    try {
      await bridge.send('VKWebAppSetViewSettings', {
        status_bar_style: this._theme === 'dark' ? 'light' : 'dark',
        action_bar_color: this._theme === 'dark' ? '#0E0E12' : '#FFFFFF',
        navigation_bar_color: this._theme === 'dark' ? '#0E0E12' : '#FFFFFF',
      });
    } catch {
      // Опционально — игнорируем
    }
  }

  private applyScheme(scheme?: string): void {
    const next: VKTheme =
      scheme && /(dark|gray|space)/i.test(scheme) ? 'dark' : 'light';
    this._theme = next;

    const body = document.body;
    body.classList.remove('vk-light', 'vk-dark');
    body.classList.add(next === 'dark' ? 'vk-dark' : 'vk-light');
    body.style.colorScheme = next;
  }

  /**
   * Данные пользователя VK. Вне VK возвращает null.
   */
  async getUserInfo(): Promise<VKUserInfo | null> {
    if (!this._isVK) return null;
    try {
      const info = await bridge.send('VKWebAppGetUserInfo');
      return info as VKUserInfo;
    } catch (e) {
      console.warn('[VK] VKWebAppGetUserInfo failed:', e);
      return null;
    }
  }

  // ============================================================
  // VK Storage (облачное хранилище пользователя)
  // ============================================================

  /** Записать ключ в облачное хранилище VK */
  async storageSet(key: string, value: string): Promise<void> {
    if (!this._isVK) return;
    try {
      await bridge.send('VKWebAppStorageSet', { key, value });
    } catch (e) {
      console.warn(`[VK] storageSet(${key}) failed:`, e);
    }
  }

  /** Прочитать список ключей из облачного хранилища VK */
  async storageGetKeys(count = 1000, offset = 0): Promise<string[]> {
    if (!this._isVK) return [];
    try {
      const res = await bridge.send('VKWebAppStorageGetKeys', { count, offset });
      return (res as any).keys || [];
    } catch (e) {
      console.warn('[VK] storageGetKeys failed:', e);
      return [];
    }
  }

  /** Прочитать значения ключей из облачного хранилища VK */
  async storageGet(keys: string[]): Promise<Record<string, string>> {
    if (!this._isVK || keys.length === 0) return {};
    try {
      const res = await bridge.send('VKWebAppStorageGet', { keys });
      const pairs: { key: string; value: string }[] = (res as any).keys || [];
      const out: Record<string, string> = {};
      for (const p of pairs) {
        if (p.value !== undefined && p.value !== null) {
          out[p.key] = p.value;
        }
      }
      return out;
    } catch (e) {
      console.warn('[VK] storageGet failed:', e);
      return {};
    }
  }

  // ============================================================
  // VK Payments (VK Pay / VK Donut)
  // ============================================================

  /**
   * Показать окно покупки товара через VK Pay.
   * @param productId ID товара, настроенный в кабинете разработчика VK
   * @returns true — покупка успешно совершена; false — отменена/ошибка
   */
  async showOrderBox(productId: string): Promise<boolean> {
    if (!this._isVK) {
      console.warn('[VK] showOrderBox доступен только внутри VK');
      return false;
    }
    try {
      const res = await bridge.send('VKWebAppShowOrderBox', {
        type: 'item',
        item: productId,
      });
      return !!(res as any).success;
    } catch (e) {
      console.warn('[VK] VKWebAppShowOrderBox failed:', e);
      return false;
    }
  }

  /**
   * Получить историю покупок пользователя для восстановления доступа.
   */
  async getOrders(): Promise<VKOrder[]> {
    if (!this._isVK) return [];
    try {
      const res = await bridge.send('VKWebAppGetOrders' as any);
      return (res as any).items || [];
    } catch (e) {
      console.warn('[VK] VKWebAppGetOrders failed:', e);
      return [];
    }
  }

  // ============================================================
  // Haptics / прочее
  // ============================================================

  /** Лёгкая вибрация при перевороте карты (поддерживается не везде) */
  async impactOccurred(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this._isVK) return;
    try {
      await bridge.send('VKWebAppImpactOccurred' as any, { style });
    } catch {
      // не критично
    }
  }

  /** Поделиться ссылкой в VK */
  async share(link: string): Promise<void> {
    if (!this._isVK) return;
    try {
      await bridge.send('VKWebAppShare', { link });
    } catch (e) {
      console.warn('[VK] VKWebAppShare failed:', e);
    }
  }
}
