import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AdversaryBrowser } from './components/adversary-browser/adversary-browser';
import { BattlePointMeter } from './components/battle-point-meter/battle-point-meter';
import { CollapsibleSection } from './components/collapsible-section/collapsible-section';
import { EncounterRoster, LabelChangeEvent, RetierEvent } from './components/encounter-roster/encounter-roster';
import { EnvironmentPicker } from './components/environment-picker/environment-picker';
import { SavingSpinner } from '../../../shared/components/saving-spinner/saving-spinner';
import { EncounterService } from '../../../shared/services/encounter.service';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EncounterResponse } from '../../../shared/models/encounter-api.model';
import { BattlePointAdjustments } from '../../../shared/utils/battle-points.utils';
import { EncounterRosterInstance } from './models/encounter-roster-instance.model';
import { ENCOUNTERS_LIST_PATH, encounterEditPath } from '../encounter-routes';
import {
  buildEncounterPayload,
  fromApiAdjustments,
  mapResponseToEnvironmentCard,
  mapResponseToRosterInstances,
} from './encounter-builder.mapper';

let nextLocalId = 0;
function generateLocalId(): string {
  return `new-${Date.now()}-${nextLocalId++}`;
}

const DEFAULT_PARTY_SIZE = 4;

/** Sections a GM can minimize. Battle Points is deliberately excluded -- it's the builder's
 * centrepiece and always stays visible. */
type BuilderSection = 'roster' | 'environment' | 'adversaries';

interface SectionCollapseState {
  isCollapsed(section: BuilderSection): boolean;
  toggle(section: BuilderSection): void;
  expand(section: BuilderSection): void;
}

/**
 * Which of the three minimizable sections are collapsed. A plain factory (like
 * `panel-layout.store.ts`'s, scaled down) rather than a class field group, so this one cohesive
 * piece of view state -- and its three template call sites -- stay out of the component's own
 * concern count. No persistence: unlike the GM screen's multi-panel dashboard, this builder is a
 * single linear form filled out once per visit, not a layout preference worth remembering.
 */
function createSectionCollapse(): SectionCollapseState {
  // Environment starts collapsed -- it's a one-off scene stat block, not something every
  // encounter needs. This does NOT defer EnvironmentPicker's fetch: it's content projected into
  // CollapsibleSection's <ng-content>, and Angular creates projected component instances (firing
  // their ngOnInit) as part of *this* component's own view construction, before
  // CollapsibleSection's internal `@if` around <ng-content> is even evaluated. So the fetch still
  // fires on load regardless of collapse state (see encounter-builder.spec.ts's
  // "still fetches environments on load even though the section starts collapsed"). Collapsing
  // this section is purely a decluttering choice, not a load-deferral one.
  const collapsed = signal<ReadonlySet<BuilderSection>>(new Set(['environment']));
  return {
    isCollapsed: section => collapsed().has(section),
    toggle: section => {
      const next = new Set(collapsed());
      if (!next.delete(section)) next.add(section);
      collapsed.set(next);
    },
    expand: section => {
      if (!collapsed().has(section)) return;
      const next = new Set(collapsed());
      next.delete(section);
      collapsed.set(next);
    },
  };
}

/** How long the newly-added roster card keeps its highlight, and the SR announcement its text. */
const ADD_FEEDBACK_MS = 1200;

/**
 * Create/edit shell for a saved encounter. Owns every field the API stores and hands instant
 * Battle Point feedback to `BattlePointMeter` via the roster it holds -- the server value is
 * what actually wins once `onSave` round-trips, per `battle-points.utils.ts`'s own contract.
 */
@Component({
  selector: 'app-encounter-builder',
  templateUrl: './encounter-builder.html',
  styleUrl: './encounter-builder.css',
  imports: [RouterLink, AdversaryBrowser, BattlePointMeter, CollapsibleSection, EncounterRoster, EnvironmentPicker, SavingSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterBuilder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encounterService = inject(EncounterService);
  private readonly destroyRef = inject(DestroyRef);

  readonly encountersListPath = ENCOUNTERS_LIST_PATH;

  readonly encounterId = signal<number | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly partySize = signal(DEFAULT_PARTY_SIZE);
  readonly adjustments = signal<BattlePointAdjustments>({});
  readonly environmentId = signal<number | undefined>(undefined);
  /** The environment's display data (name/type/tier), kept alongside `environmentId` purely so
   * the roster can show what's attached without re-fetching -- see `onEnvironmentSelected` and
   * `mapResponseToEnvironmentCard`. Environments cost no Battle Points, so this never touches
   * `roster` or the meter. */
  readonly selectedEnvironment = signal<CardData | undefined>(undefined);
  readonly roster = signal<EncounterRosterInstance[]>([]);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal(false);
  readonly savedRecently = signal(false);

  readonly sections = createSectionCollapse();

  /** Id of the roster instance to highlight, and the text an aria-live region announces, right
   * after `onAddAdversary` -- see ADD_FEEDBACK_MS. */
  readonly justAddedInstanceId = signal<string | null>(null);
  readonly addAnnouncement = signal('');
  private addFeedbackTimeout?: ReturnType<typeof setTimeout>;
  private announceTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.addFeedbackTimeout);
      clearTimeout(this.announceTimeout);
    });
  }

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
    const localId = generateLocalId();
    this.roster.update(list => [
      ...list,
      { localId, adversaryId: adversary.id, adversary, displayOrder: list.length },
    ]);

    // Reveal where it landed even if the GM had minimized the roster while browsing.
    this.sections.expand('roster');

    clearTimeout(this.addFeedbackTimeout);
    this.justAddedInstanceId.set(localId);
    this.addFeedbackTimeout = setTimeout(() => this.justAddedInstanceId.set(null), ADD_FEEDBACK_MS);

    // Clear first so a second addition of the same-named adversary still changes the live
    // region's text content and gets re-announced, not silently swallowed as a no-op update.
    this.addAnnouncement.set('');
    clearTimeout(this.announceTimeout);
    this.announceTimeout = setTimeout(() => this.addAnnouncement.set(`${adversary.name} added to roster`), 50);
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

  onEnvironmentSelected(card: CardData | undefined): void {
    this.environmentId.set(card?.id);
    this.selectedEnvironment.set(card);
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
    const previousEnvironment = this.selectedEnvironment();
    const request$ = id === null
      ? this.encounterService.createEncounter(payload)
      : this.encounterService.updateEncounter(id, payload);

    request$
      .pipe(catchError(() => { this.saveError.set(true); return of(null); }))
      .subscribe(response => {
        this.saving.set(false);
        if (!response) return;

        this.applyEncounter(response, previousRoster, previousEnvironment);
        if (id === null) {
          this.router.navigate([encounterEditPath(response.id)], { replaceUrl: true });
        } else {
          this.savedRecently.set(true);
        }
      });
  }

  private applyEncounter(
    response: EncounterResponse,
    previousRoster: EncounterRosterInstance[] = [],
    previousEnvironment?: CardData,
  ): void {
    this.encounterId.set(response.id);
    this.name.set(response.name);
    this.description.set(response.description ?? '');
    this.partySize.set(response.partySize ?? DEFAULT_PARTY_SIZE);
    this.adjustments.set(fromApiAdjustments(response));
    this.environmentId.set(response.environmentId);
    this.selectedEnvironment.set(mapResponseToEnvironmentCard(response, previousEnvironment));
    this.roster.set(mapResponseToRosterInstances(response, previousRoster));
  }
}
