import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DaggerheartCard } from '../../../daggerheart-card/daggerheart-card';
import { CardData } from '../../../daggerheart-card/daggerheart-card.model';

@Component({
  selector: 'app-card-edit-preview',
  templateUrl: './card-edit-preview.html',
  styleUrl: './card-edit-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DaggerheartCard],
})
export class CardEditPreview {
  readonly card = input<CardData | null>(null);
}
