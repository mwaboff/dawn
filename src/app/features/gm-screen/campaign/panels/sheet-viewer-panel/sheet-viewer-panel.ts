import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, from, mergeMap, tap } from 'rxjs';

import { CharacterSheetService } from '../../../../../core/services/character-sheet.service';
import { CampaignCharacterSheet } from '../../../../../shared/models/campaign-api.model';
import { mapToCharacterSheetView } from '../../../../character-sheet/utils/character-sheet-view.mapper';
import { CharacterSheetView } from '../../../../character-sheet/models/character-sheet-view.model';
import { GmScreenContext } from '../../gm-screen-context.service';
import { PartyMemberDetail } from './components/party-member-detail/party-member-detail';

/** Everything the stat block below a roster row renders. Kept in sync with the detail template. */
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

/** Four at a time: enough to fill a typical party in one round trip without flooding the API. */
const FETCH_CONCURRENCY = 4;

export interface PartyGroup {
  readonly label: string;
  readonly members: readonly CampaignCharacterSheet[];
}

/**
 * Every campaign character as a vitals-first roster, because mid-combat the GM's question is
 * "what is everyone's Evasion and who is bloodied", not "show me one sheet". Each row expands into
 * the full stat block; sheets are fetched once and cached for the life of the panel.
 */
@Component({
  selector: 'app-sheet-viewer-panel',
  templateUrl: './sheet-viewer-panel.html',
  styleUrl: './sheet-viewer-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PartyMemberDetail],
})
export class SheetViewerPanel {
  private readonly context = inject(GmScreenContext);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly sheets = signal<ReadonlyMap<number, CharacterSheetView>>(new Map());
  private readonly loadingIds = signal<ReadonlySet<number>>(new Set());
  private readonly failedIds = signal<ReadonlySet<number>>(new Set());

  readonly expandedId = signal<number | null>(null);

  readonly groups = computed<readonly PartyGroup[]>(() => {
    const campaign = this.context.campaign();
    return [
      { label: 'Player characters', members: campaign?.playerCharacters ?? [] },
      { label: 'NPCs', members: campaign?.nonPlayerCharacters ?? [] },
    ].filter(group => group.members.length > 0);
  });

  readonly hasMembers = computed(() => this.groups().length > 0);
  readonly anyLoading = computed(() => this.loadingIds().size > 0);

  constructor() {
    effect(() => {
      const ids = this.groups().flatMap(group => group.members.map(member => member.id));
      untracked(() => this.loadMissing(ids));
    });
  }

  sheetFor(id: number): CharacterSheetView | null {
    return this.sheets().get(id) ?? null;
  }

  isLoading(id: number): boolean {
    return this.loadingIds().has(id);
  }

  hasFailed(id: number): boolean {
    return this.failedIds().has(id);
  }

  isExpanded(id: number): boolean {
    return this.expandedId() === id;
  }

  /** One open at a time: two full stat blocks in a panel column is unreadable. */
  toggle(id: number): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  /** Drops every cached sheet so the next render refetches -- vitals go stale within a scene. */
  refresh(): void {
    this.sheets.set(new Map());
    this.failedIds.set(new Set());
    this.loadMissing(this.groups().flatMap(group => group.members.map(member => member.id)));
  }

  private loadMissing(ids: readonly number[]): void {
    const sheets = this.sheets();
    const loading = this.loadingIds();
    const pending = ids.filter(id => !sheets.has(id) && !loading.has(id));
    if (pending.length === 0) return;

    this.loadingIds.update(current => new Set([...current, ...pending]));
    from(pending)
      .pipe(
        mergeMap(id => this.fetch(id), FETCH_CONCURRENCY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private fetch(id: number) {
    return this.characterSheetService.getCharacterSheet(id, EXPAND_FIELDS).pipe(
      tap(response => {
        this.sheets.update(current => new Map(current).set(id, mapToCharacterSheetView(response)));
        this.settle(id);
      }),
      catchError(() => {
        this.failedIds.update(current => new Set(current).add(id));
        this.settle(id);
        return EMPTY;
      }),
    );
  }

  private settle(id: number): void {
    this.loadingIds.update(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }
}
