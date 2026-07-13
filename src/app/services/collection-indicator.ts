import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CollectionIndicator {
  private indicatorSource = new BehaviorSubject<string>('');
  indicator$ = this.indicatorSource.asObservable();

  setIndicatorText(text: string): void {
    this.indicatorSource.next(text);
  }
}
