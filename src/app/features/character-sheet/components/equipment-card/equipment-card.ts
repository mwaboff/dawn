import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FeatureDisplay } from '../../models/character-sheet-view.model';

export interface EquipmentStat {
  label: string;
  value: string;
}

@Component({
  selector: 'app-equipment-card',
  templateUrl: './equipment-card.html',
  styleUrl: './equipment-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentCard {
  readonly name = input.required<string>();
  readonly badge = input<string>();
  readonly stats = input<EquipmentStat[]>([]);
  readonly features = input<FeatureDisplay[]>([]);
}
