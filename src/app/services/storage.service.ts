import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Гибридное хранилище.
 *
 * Проблема: данные в `localStorage` WebView сбрасываются при очистке кэша приложения.
 * Решение: дублируем важные данные в нативное хранилище `@capacitor/preferences`
 * (SharedPreferences), которое переживает очистку кэша. При старте приложения
 * восстанавливаем данные из нативного хранилища обратно в `localStorage`.
 *
 * Существующий синхронный код продолжает работать с `localStorage`, а нативный
 * бэкап гарантирует сохранность при очистке кэша.
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  /** Ключи, которые нужно бэкапить в нативное хранилище. */
  private readonly BACKUP_KEYS = [
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

  private readonly PREFIX = 'backup_';

  /**
   * Записывает значение в localStorage и дублирует его в нативное хранилище.
   */
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
    this.backup(key, value);
  }

  /**
   * Читает значение из localStorage.
   */
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Удаляет значение из localStorage и нативного хранилища.
   */
  remove(key: string): void {
    localStorage.removeItem(key);
    this.removeBackup(key);
  }

  /**
   * Дублирует текущее значение localStorage в нативное хранилище.
   */
  backup(key: string, value?: string): void {
    if (!this.BACKUP_KEYS.includes(key)) {
      return;
    }
    const val = value !== undefined ? value : localStorage.getItem(key);
    if (val === null) {
      return;
    }
    Preferences.set({ key: this.PREFIX + key, value: val }).catch(() => {
      // Не критично — бэкап не удался, localStorage всё ещё работает
    });
  }

  /**
   * Удаляет бэкап из нативного хранилища.
   */
  private removeBackup(key: string): void {
    Preferences.remove({ key: this.PREFIX + key }).catch(() => {
      // ignore
    });
  }

  /**
   * Сохраняет статус покупки (премиум) в localStorage и нативное хранилище.
   * Используется billing-сервисом.
   */
  savePurchaseStatus(status: boolean): void {
    this.set('cardGamePremiumStatus', status ? 'true' : 'false');
  }

  /**
   * Восстанавливает данные из нативного хранилища в localStorage.
   * Вызывается при старте приложения. Если в localStorage данных нет
   * (например, после очистки кэша), а в нативном хранилище есть — восстанавливаем.
   */
  async restoreAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    for (const key of this.BACKUP_KEYS) {
      try {
        const current = localStorage.getItem(key);
        if (current !== null) {
          // В localStorage уже есть данные — обновляем бэкап на всякий случай
          this.backup(key, current);
          continue;
        }

        const { value } = await Preferences.get({ key: this.PREFIX + key });
        if (value !== null && value !== undefined) {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}
