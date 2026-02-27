import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CardFeature } from '../daggerheart-card.model';
import { escapeAndFormatHtml } from '../../../utils/text.utils';

@Component({
  selector: 'app-card-feature-item',
  templateUrl: './card-feature-item.html',
  styleUrl: './card-feature-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFeatureItem {
  readonly feature = input.required<CardFeature>();

  formatText(text: string): string {
    return escapeAndFormatHtml(text);
  }
}
