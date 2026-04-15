import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FeatureDisplay } from '../../models/character-sheet-view.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';

export interface EquipmentStat {
  label: string;
  value: string;
}

@Component({
  selector: 'app-equipment-card',
  templateUrl: './equipment-card.html',
  styleUrl: './equipment-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class EquipmentCard {
  readonly name = input.required<string>();
  readonly badge = input<string>();
  readonly subBadge = input<string>();
  readonly stats = input<EquipmentStat[]>([]);
  readonly burden = input<string>('');
  readonly features = input<FeatureDisplay[]>([]);
}
