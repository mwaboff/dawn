import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { SearchableEntityType, typeLabels, typeGlyphs, BROWSABLE_TYPES } from '../../models/search.model';

interface TypeCard {
  type: SearchableEntityType;
  label: string;
  glyph: string;
  tagline: string;
}

const TYPE_TAGLINES: Partial<Record<SearchableEntityType, string>> = {
  DOMAIN: 'The domains of knowledge and power.',
  CLASS: 'The calling that defines your path.',
  SUBCLASS_CARD: 'Specializations that sharpen your calling.',
  ANCESTRY_CARD: 'The blood and bone that shaped who you are.',
  COMMUNITY_CARD: 'The people and places that forged your bonds.',
  DOMAIN_CARD: 'Abilities and spells drawn from the domains.',
  WEAPON: 'Swords, bows, and the weight they leave behind.',
  ARMOR: 'Shields and plate that stand between you and ruin.',
  LOOT: 'Treasures, relics, and curiosities found along the way.',
  ADVERSARY: 'Creatures and foes the GM can unleash.',
  COMPANION: 'Loyal beasts and bonded allies at your side.',
};

@Component({
  selector: 'app-landing-type-grid',
  templateUrl: './landing-type-grid.html',
  styleUrl: './landing-type-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingTypeGrid {
  readonly typeSelect = output<SearchableEntityType>();

  readonly typeCards: TypeCard[] = BROWSABLE_TYPES.map(t => ({
    type: t,
    label: typeLabels[t] ?? t,
    glyph: typeGlyphs[t] ?? '◆',
    tagline: TYPE_TAGLINES[t] ?? '',
  }));

  onTypeClick(type: SearchableEntityType): void {
    this.typeSelect.emit(type);
  }
}
