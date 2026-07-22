import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TermsService } from '../../services/terms';
import { TermsModalComponent } from '../../components/terms-modal/terms-modal';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, TermsModalComponent],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class WelcomePage {
  isChecked = false;
  showTermsModal = false;

  constructor(
    private termsService: TermsService,
    private router: Router
  ) {}

  onCheckboxChange(event: Event): void {
    this.isChecked = (event.target as HTMLInputElement).checked;
  }

  openTerms(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showTermsModal = true;
  }

  closeTerms(): void {
    this.showTermsModal = false;
  }

  enterApp(): void {
    if (!this.isChecked) return;
    this.termsService.acceptTerms();
    this.router.navigateByUrl('/prediction');
  }
}
