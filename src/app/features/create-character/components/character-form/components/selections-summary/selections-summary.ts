import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

import { CharacterSelections } from '../../../../models/create-character.model';

@Component({
  selector: 'app-selections-summary',
  templateUrl: './selections-summary.html',
  styleUrl: './selections-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionsSummary {
  readonly selections = input<CharacterSelections>({});

  readonly hasSelections = computed(() => {
    const s = this.selections();
    return !!(s.class || s.subclass || s.domains || s.ancestry || s.community);
  });
}
