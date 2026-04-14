import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Prediction } from './pages/prediction/prediction';
import { Collection } from './pages/collection/collection';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'prediction', component: Prediction },
  { path: 'collection', component: Collection },
  { path: '**', redirectTo: '' }
];
