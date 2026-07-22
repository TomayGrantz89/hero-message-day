import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TermsService } from '../services/terms';

@Injectable({
  providedIn: 'root',
})
export class TermsGuard implements CanActivate {
  constructor(
    private termsService: TermsService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.termsService.isTermsAccepted()) {
      return true;
    }
    return this.router.parseUrl('/welcome');
  }
}
