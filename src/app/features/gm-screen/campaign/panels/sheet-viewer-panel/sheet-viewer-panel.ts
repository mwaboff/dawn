import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';

import { CharacterSheetService } from '../../../../../core/services/character-sheet.service';
import { CampaignCharacterSheet } from '../../../../../shared/models/campaign-api.model';
import { mapToCharacterSheetView } from '../../../../character-sheet/utils/character-sheet-view.mapper';
import { CharacterSheetView, WeaponDisplay } from '../../../../character-sheet/models/character-sheet-view.model';
import { GmScreenContext } from '../../gm-screen-context.service';

/** Everything the read-only GM stat block below renders. Kept in sync with the template. */
const EXPAND_FIELDS = [
  'experiences',
  'communityCards',
  'ancestryCards',
  'class',
  'subclassCards',
  'domainCards',
  'inventoryWeapons',
  'inventoryArmors',
  'inventoryItems',
  'features',
  'costTags',
  'modifiers',
];

export interface SheetOption {
  id: number;
  label: string;
}

/**
 * Read-only view of a campaign character. Editing is deliberately absent: NPC editing from the GM
 * screen needs a campaign-aware `CharacterSheetService.validateAccess` on the backend first.
 */
@Component({
  selector: 'app-sheet-viewer-panel',
  templateUrl: './sheet-viewer-panel.html',
  styleUrl: './sheet-viewer-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetViewerPanel {
  private readonly context = inject(GmScreenContext);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedId = signal<number | null>(null);
  readonly sheet = signal<CharacterSheetView | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly playerOptions = computed(() =>
    this.toOptions(this.context.campaign()?.playerCharacters, this.context.campaign()?.playerCharacterIds),
  );
  readonly npcOptions = computed(() =>
    this.toOptions(this.context.campaign()?.nonPlayerCharacters, this.context.campaign()?.nonPlayerCharacterIds),
  );
  readonly hasOptions = computed(() => this.playerOptions().length > 0 || this.npcOptions().length > 0);

  readonly equippedWeapons = computed(() => {
    const view = this.sheet();
    if (!view) return [];
    return [view.activePrimaryWeapon, view.activeSecondaryWeapon].filter(
      (weapon): weapon is WeaponDisplay => weapon !== null,
    );
  });

  private readonly load$ = new Subject<number>();

  constructor() {
    this.initLoadPipeline();
  }

  onSelect(value: string): void {
    const id = Number(value);
    if (!id) {
      this.selectedId.set(null);
      this.sheet.set(null);
      this.error.set(false);
      return;
    }
    this.selectedId.set(id);
    this.load$.next(id);
  }

  refresh(): void {
    const id = this.selectedId();
    if (id !== null) this.load$.next(id);
  }

  signed(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  private toOptions(sheets: CampaignCharacterSheet[] | undefined, ids: number[] | undefined): SheetOption[] {
    if (sheets?.length) {
      return sheets.map(s => ({ id: s.id, label: `${s.name} (Lv ${s.level})` }));
    }
    return (ids ?? []).map(id => ({ id, label: `Character #${id}` }));
  }

  private initLoadPipeline(): void {
    this.load$
      .pipe(
        switchMap(id => {
          this.loading.set(true);
          this.error.set(false);
          return this.characterSheetService.getCharacterSheet(id, EXPAND_FIELDS).pipe(
            tap(response => {
              this.sheet.set(mapToCharacterSheetView(response));
              this.loading.set(false);
            }),
            catchError(() => {
              this.sheet.set(null);
              this.error.set(true);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
