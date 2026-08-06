import { Component } from '@angular/core';
import { Premium } from '../../services/premium';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
  isProcessing = false;

  constructor(private readonly premium: Premium) {}

  async onBuyClick(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const success = await this.premium.buyFullVersion();

      if (success) {
        alert('Покупка успешно завершена! Полная коллекция карт разблокирована.');
      } else {
        alert('Не удалось завершить покупку. Попробуйте ещё раз.');
      }
    } catch (error) {
      console.error('Ошибка при покупке:', error);
      alert('Произошла ошибка при покупке. Проверьте подключение к интернету.');
    } finally {
      this.isProcessing = false;
    }
  }

  async onRestoreClick(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const restored = await this.premium.restorePurchases();

      if (restored) {
        alert('Покупки успешно восстановлены! Полная коллекция карт разблокирована.');
      } else {
        alert('Не удалось найти покупки для восстановления.');
      }
    } catch (error) {
      console.error('Ошибка при восстановлении покупок:', error);
      alert('Произошла ошибка при восстановлении покупок. Попробуйте ещё раз.');
    } finally {
      this.isProcessing = false;
    }
  }
}
