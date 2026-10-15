import { Injectable } from '@angular/core';
import { VkBridgeService } from './vk-bridge.service';

/**
 * Хранилище VK Mini App.
 *
 * Синхронный слой поверх `localStorage` (весь существующий код работает
 * с ним без изменений) + фоновое зеркалирование важных ключей в облачное
 * хранилище VK (`VKWebAppStorageSet`), которое:
 *  - переживает очистку кэша webview;
 *  - привязано к пользователю VK и доступно с любого устройства.
 *
 * При старте `restoreAll()` восстанавливает недостающие локальные ключи
 * из облака VK.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /** Ключи, которые дублируются в облачное хранилище VK. */
  private readonly MIRROR_KEYS = [
    'cardGameCollection',
    'cardGameAttempts',
    'cardGameLastReset',
    'cardGamePredictionReceived',
    'cardGameLastCardData',
    'cardGameTodayPredictionIds',
    'cardGameQuestionAttempts',
    'cardGameQuestionLastReset',
    'cardGamePremiumStatus',
    'cardGamePremiumPurchaseDate',
  ];

  /** Префикс ключей в облачном хранилище VK. */
  private readonly VK_PREFIX = 'cg_';

  private restoreStarted = false;

  constructor(private vk: VkBridgeService) {}

  /**
   * Записывает значение в localStorage и зеркалирует в VK Storage.
   */
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
    if (this.MIRROR_KEYS.includes(key)) {
      // Огнезабываемо: ошибка облака не должна ломать основную запись
      this.vk.storageSet(this.VK_PREFIX + key, value).catch(() => undefined);
    }
  }

  /**
   * Читает значение из localStorage.
   */
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Удаляет значение из localStorage; в VK Storage пишется пустая строка
   * (API не поддерживает удаление отдельных ключей).
   */
  remove(key: string): void {
    localStorage.removeItem(key);
    if (this.MIRROR_KEYS.includes(key)) {
      this.vk.storageSet(this.VK_PREFIX + key, '').catch(() => undefined);
    }
  }

  /**
   * Сохраняет статус покупки (премиум) в localStorage и VK Storage.
   */
  savePurchaseStatus(status: boolean): void {
    this.set('cardGamePremiumStatus', status ? 'true' : 'false');
  }

  /**
   * Восстанавливает недостающие локальные данные из облака VK.
   * Вызывается один раз при старте приложения (APP_INITIALIZER).
   */
  async restoreAll(): Promise<void> {
    if (this.restoreStarted || !this.vk.isVK) {
      return;
    }
    this.restoreStarted = true;

    try {
      const cloudKeys = await this.vk.storageGetKeys(1000, 0);
      const missingLocal = cloudKeys
        .filter((k) => k.startsWith(this.VK_PREFIX))
        .map((k) => k.slice(this.VK_PREFIX.length))
        .filter(
          (k) => this.MIRROR_KEYS.includes(k) && localStorage.getItem(k) === null
        );

      if (missingLocal.length === 0) {
        return;
      }

      const values = await this.vk.storageGet(
        missingLocal.map((k) => this.VK_PREFIX + k)
      );

      for (const key of missingLocal) {
        const raw = values[this.VK_PREFIX + key];
        if (raw) {
          localStorage.setItem(key, raw);
        }
      }
    } catch (e) {
      console.warn('[Storage] Восстановление из VK Storage не удалось:', e);
    }
  }
}
