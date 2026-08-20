import { Routes } from '@angular/router';
import { Prediction } from './pages/prediction/prediction';
import { Collection } from './pages/collection/collection';
import { Question } from './pages/question/question';
import { WelcomePage } from './pages/welcome/welcome';
import { ShopComponent } from './pages/shop/shop.component';
import { TermsGuard } from './guards/terms.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'prediction', pathMatch: 'full' },
  { path: 'welcome', component: WelcomePage },
  {
    path: 'prediction',
    component: Prediction,
    canActivate: [TermsGuard],
  },
  {
    path: 'collection',
    component: Collection,
    canActivate: [TermsGuard],
  },
  {
    path: 'question',
    component: Question,
    canActivate: [TermsGuard],
  },
  {
    path: 'shop',
    component: ShopComponent,
    canActivate: [TermsGuard],
  },
  { path: '**', redirectTo: 'prediction' },
];
