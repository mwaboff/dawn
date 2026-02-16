import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card-skeleton',
  templateUrl: './card-skeleton.html',
  styleUrl: './card-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeleton {
  readonly count = input(9);

  protected readonly Array = Array;
}
