import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CharacterSheetView, WeaponDisplay } from '../../../../../../character-sheet/models/character-sheet-view.model';

/**
 * The full read-only stat block for one party member, revealed under its roster row.
 *
 * Editing is deliberately absent: NPC editing from the GM screen needs a campaign-aware
 * `CharacterSheetService.validateAccess` on the backend first.
 */
@Component({
  selector: 'app-party-member-detail',
  templateUrl: './party-member-detail.html',
  styleUrl: './party-member-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyMemberDetail {
  readonly sheet = input.required<CharacterSheetView>();

  readonly equippedWeapons = computed(() =>
    [this.sheet().activePrimaryWeapon, this.sheet().activeSecondaryWeapon].filter(
      (weapon): weapon is WeaponDisplay => weapon !== null,
    ),
  );

  signed(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }
}
