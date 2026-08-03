import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { AdversaryBrowser } from './components/adversary-browser/adversary-browser';
import { BattlePointMeter } from './components/battle-point-meter/battle-point-meter';
import { EncounterRoster, LabelChangeEvent, RetierEvent } from './components/encounter-roster/encounter-roster';
import { EnvironmentPicker } from './components/environment-picker/environment-picker';
import { SavingSpinner } from '../../../shared/components/saving-spinner/saving-spinner';
import { EncounterService } from '../../../shared/services/encounter.service';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { EncounterResponse } from '../../../shared/models/encounter-api.model';
import { BattlePointAdjustments } from '../../../shared/utils/battle-points.utils';
import { EncounterRosterInstance } from './models/encounter-roster-instance.model';
import { ENCOUNTERS_LIST_PATH, encounterEditPath } from '../encounter-routes';
import { buildEncounterPayload, fromApiAdjustments, mapResponseToRosterInstances } from './encounter-builder.mapper';

let nextLocalId = 0;
function generateLocalId(): string {
  return `new-${Date.now()}-${nextLocalId++}`;
}

const DEFAULT_PARTY_SIZE = 4;

/**
 * Create/edit shell for a saved encounter. Owns every field the API stores and hands instant
 * Battle Point feedback to `BattlePointMeter` via the roster it holds -- the server value is
 * what actually wins once `onSave` round-trips, per `battle-points.utils.ts`'s own contract.
 */
@Component({
  selector: 'app-encounter-builder',
  templateUrl: './encounter-builder.html',
  styleUrl: './encounter-builder.css',
  imports: [RouterLink, AdversaryBrowser, BattlePointMeter, EncounterRoster, EnvironmentPicker, SavingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterBuilder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encounterService = inject(EncounterService);

  readonly encountersListPath = ENCOUNTERS_LIST_PATH;

  readonly encounterId = signal<number | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly partySize = signal(DEFAULT_PARTY_SIZE);
  readonly adjustments = signal<BattlePointAdjustments>({});
  readonly environmentId = signal<number | undefined>(undefined);
  readonly roster = signal<EncounterRosterInstance[]>([]);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal(false);
  readonly savedRecently = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) return;

    const id = Number(idParam);
    this.encounterId.set(id);
    this.loading.set(true);
    this.encounterService
      .getEncounter(id, 'environment,adversaryDetails')
      .pipe(catchError(() => { this.loadError.set(true); return of(null); }))
      .subscribe(response => {
        this.loading.set(false);
        if (response) {
          this.applyEncounter(response);
        }
      });
  }

  onAddAdversary(adversary: AdversaryData): void {
    this.roster.update(list => [
      ...list,
      { localId: generateLocalId(), adversaryId: adversary.id, adversary, displayOrder: list.length },
    ]);
  }

  onRemoveInstance(localId: string): void {
    this.roster.update(list =>
      list.filter(i => i.localId !== localId).map((i, index) => ({ ...i, displayOrder: index })),
    );
  }

  onRetierInstance({ localId, tier }: RetierEvent): void {
    this.roster.update(list => list.map(i => (i.localId === localId ? { ...i, tierOverride: tier } : i)));
  }

  onLabelChange({ localId, label }: LabelChangeEvent): void {
    this.roster.update(list => list.map(i => (i.localId === localId ? { ...i, label: label || undefined } : i)));
  }

  onPartySizeChange(size: number): void {
    this.partySize.set(size);
  }

  onAdjustmentsChange(adjustments: BattlePointAdjustments): void {
    this.adjustments.set(adjustments);
  }

  onEnvironmentSelected(environmentId: number | undefined): void {
    this.environmentId.set(environmentId);
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  onSave(): void {
    if (!this.name().trim()) return;

    this.saving.set(true);
    this.saveError.set(false);
    this.savedRecently.set(false);

    const payload = buildEncounterPayload({
      name: this.name(),
      description: this.description(),
      partySize: this.partySize(),
      adjustments: this.adjustments(),
      environmentId: this.environmentId(),
      roster: this.roster(),
    });
    const id = this.encounterId();
    const previousRoster = this.roster();
    const request$ = id === null
      ? this.encounterService.createEncounter(payload)
      : this.encounterService.updateEncounter(id, payload);

    request$
      .pipe(catchError((err: HttpErrorResponse) => { this.saveError.set(true); return of(null); }))
      .subscribe(response => {
        this.saving.set(false);
        if (!response) return;

        this.applyEncounter(response, previousRoster);
        if (id === null) {
          this.router.navigate([encounterEditPath(response.id)], { replaceUrl: true });
        } else {
          this.savedRecently.set(true);
        }
      });
  }

  private applyEncounter(response: EncounterResponse, previousRoster: EncounterRosterInstance[] = []): void {
    this.encounterId.set(response.id);
    this.name.set(response.name);
    this.description.set(response.description ?? '');
    this.partySize.set(response.partySize ?? DEFAULT_PARTY_SIZE);
    this.adjustments.set(fromApiAdjustments(response));
    this.environmentId.set(response.environmentId);
    this.roster.set(mapResponseToRosterInstances(response, previousRoster));
  }
}
