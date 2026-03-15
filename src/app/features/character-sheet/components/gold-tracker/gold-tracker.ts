import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-gold-tracker',
  templateUrl: './gold-tracker.html',
  styleUrl: './gold-tracker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoldTracker {
  readonly currentGold = input.required<number>();
  readonly adjustGold = output<number>();

  onAdjust(amount: number): void {
    this.adjustGold.emit(amount);
  }
}
