import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  inject,
  DestroyRef,
  OnInit,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { AdminLookupService } from '../../services/admin-lookup.service';
import { LookupKey, LookupOption } from '../../schema/card-edit-schema.types';

@Component({
  selector: 'app-entity-multi-select',
  templateUrl: './entity-multi-select.html',
  styleUrl: './entity-multi-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityMultiSelect implements OnInit {
  private readonly adminLookupService = inject(AdminLookupService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lookup = input.required<LookupKey>();
  readonly control = input.required<FormControl<number[]>>();
  readonly label = input<string | undefined>(undefined);
  readonly dependsOnControl = input<FormControl<number | null> | undefined>(undefined);
  readonly params = input<{ classId?: number; expansionId?: number } | undefined>(undefined);

  readonly options = signal<LookupOption[]>([]);
  readonly loading = signal(true);

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
    this.loading.set(true);
    this.adminLookupService
      .list(this.lookup(), this.params())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(opts => {
        this.options.set(opts);
        this.loading.set(false);
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
