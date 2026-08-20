import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Premium } from '../../services/premium';
import { TermsModalComponent } from '../../components/terms-modal/terms-modal';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, TermsModalComponent],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
  isProcessing = false;
  showTermsModal = false;

  constructor(private readonly premium: Premium) {}

  openTerms(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showTermsModal = true;
  }

  closeTerms(): void {
    this.showTermsModal = false;
  }

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
