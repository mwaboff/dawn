import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CardFeature } from '../daggerheart-card.model';
import { FormatTextPipe } from '../../../pipes/format-text.pipe';

@Component({
  selector: 'app-card-feature-item',
  templateUrl: './card-feature-item.html',
  styleUrl: './card-feature-item.css',
  imports: [FormatTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFeatureItem {
  readonly feature = input.required<CardFeature>();
}
