import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  inject,
  DestroyRef,
  OnInit,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ENTITY_FORM_LOOKUP } from '../entity-form-lookup.token';
import { LookupKey, LookupOption } from '../entity-form.types';

@Component({
  selector: 'app-entity-multi-select',
  templateUrl: './entity-multi-select.html',
  styleUrl: './entity-multi-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityMultiSelect implements OnInit {
  private readonly lookupService = inject(ENTITY_FORM_LOOKUP, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Which catalog to fetch. Omit it when supplying `presetOptions` instead. */
  readonly lookup = input<LookupKey | undefined>(undefined);
  readonly control = input.required<FormControl<number[]>>();
  readonly label = input<string | undefined>(undefined);
  readonly dependsOnControl = input<FormControl<number | null> | undefined>(undefined);
  readonly params = input<{ classId?: number; expansionId?: number } | undefined>(undefined);
  /**
   * Options the caller already holds, which bypass the lookup service entirely. Needed by pickers
   * whose choices are not an admin catalog at all -- the signed-in user's campaigns, say -- and by
   * presentational components that must not perform I/O of their own. `null` means "go and fetch".
   */
  readonly presetOptions = input<LookupOption[] | null>(null);

  private readonly loadedOptions = signal<LookupOption[]>([]);
  private readonly fetching = signal(true);

  readonly options = computed(() => this.presetOptions() ?? this.loadedOptions());
  readonly loading = computed(() => this.presetOptions() === null && this.fetching());

  constructor() {
    effect(() => {
      const dep = this.dependsOnControl();
      if (!dep) return;

      dep.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.loadOptions();
        });
    });
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  isSelected(id: number): boolean {
    return this.control().value.includes(id);
  }

  toggle(id: number): void {
    const ctrl = this.control();
    const current = ctrl.value;
    const next = current.includes(id)
      ? current.filter(v => v !== id)
      : [...current, id];
    ctrl.setValue(next);
    ctrl.markAsDirty();
  }

  private loadOptions(): void {
    // Caller-supplied options are authoritative -- never overwrite them with a fetch.
    if (this.presetOptions() !== null) return;

    const lookup = this.lookup();
    if (!this.lookupService || !lookup) {
      // No lookup provider (e.g. schemas with no entity/entityMulti fields) -- not an
      // error, just nothing to load.
      this.fetching.set(false);
      return;
    }

    this.fetching.set(true);
    this.lookupService
      .list(lookup, this.params())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(opts => {
        this.loadedOptions.set(opts);
        this.fetching.set(false);
        this.pruneStaleSelections(opts);
      });
  }

  private pruneStaleSelections(opts: LookupOption[]): void {
    const validIds = new Set(opts.map(o => o.id));
    const ctrl = this.control();
    const pruned = ctrl.value.filter(id => validIds.has(id));
    if (pruned.length !== ctrl.value.length) {
      ctrl.setValue(pruned);
    }
  }
}
