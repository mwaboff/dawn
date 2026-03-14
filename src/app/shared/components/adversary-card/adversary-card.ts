import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';

import { AdversaryData } from './adversary-card.model';
import { CardFeatureItem } from '../daggerheart-card/card-feature-item/card-feature-item';

@Component({
  selector: 'app-adversary-card',
  templateUrl: './adversary-card.html',
  styleUrl: './adversary-card.css',
  imports: [CardFeatureItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdversaryCard {
  readonly adversary = input.required<AdversaryData>();
  readonly layout = input<'default' | 'wide'>('default');

  private readonly descriptionExpanded = signal(false);

  get isDescriptionExpanded(): boolean {
    return this.descriptionExpanded();
  }

  toggleDescription(event: Event): void {
    event.stopPropagation();
    this.descriptionExpanded.set(!this.descriptionExpanded());
  }

  get tierLabel(): string {
    return `T${this.adversary().tier}`;
  }

  get damageLabel(): string {
    const dmg = this.adversary().damage;
    if (!dmg) return '';
    return `${dmg.notation} ${dmg.damageType}`;
  }

  get attackModifierLabel(): string {
    const mod = this.adversary().attackModifier;
    if (mod === undefined || mod === null) return '';
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
