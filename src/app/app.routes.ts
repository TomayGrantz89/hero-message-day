import { Routes } from '@angular/router';
import { Prediction } from './pages/prediction/prediction';
import { Collection } from './pages/collection/collection';
import { Question } from './pages/question/question';

export const routes: Routes = [
  { path: '', redirectTo: 'prediction', pathMatch: 'full' },
  { path: 'prediction', component: Prediction },
  { path: 'collection', component: Collection },
  { path: 'question', component: Question },
  { path: '**', redirectTo: 'prediction' }
];
