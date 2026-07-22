import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-modal.html',
  styleUrl: './terms-modal.scss',
})
export class TermsModalComponent {
  @Input() termsUrl: string | null = null;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close only if the backdrop itself was clicked, not the card
    if ((event.target as HTMLElement).classList.contains('terms-backdrop')) {
      this.onClose();
    }
  }
}
