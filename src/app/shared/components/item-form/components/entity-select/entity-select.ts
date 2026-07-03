import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AdminLookupService } from '../../services/admin-lookup.service';
import { LookupKey, LookupOption } from '../../schema/card-edit-schema.types';

@Component({
  selector: 'app-entity-select',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-select.html',
  styleUrl: './entity-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitySelect implements OnInit {
  private readonly adminLookupService = inject(AdminLookupService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lookup = input.required<LookupKey>();
  readonly control = input.required<FormControl<number | null>>();
  readonly label = input<string>('');
  readonly allowCreate = input<boolean>(false);
  readonly dependsOnControl = input<FormControl<number | null> | undefined>(undefined);
  readonly params = input<{ classId?: number; expansionId?: number } | undefined>(undefined);
  readonly placeholder = input<string>('Select...');

  readonly createRequested = output<void>();

  private readonly optionsSignal = signal<LookupOption[]>([]);
  readonly options = this.optionsSignal.asReadonly();

  private readonly loadingSignal = signal(true);
  readonly loading = this.loadingSignal.asReadonly();

  ngOnInit(): void {
    this.loadOptions(this.params());

    const dependsOn = this.dependsOnControl();
    if (dependsOn) {
      dependsOn.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((newValue) => {
        const currentParams = this.params();
        const updatedParams = newValue != null ? { ...currentParams, classId: newValue } : currentParams;
        this.loadOptions(updatedParams, true);
      });
    }
  }

  private loadOptions(
    params: { classId?: number; expansionId?: number } | undefined,
    clearIfMissing = false,
  ): void {
    this.loadingSignal.set(true);
    this.adminLookupService.list(this.lookup(), params).subscribe((opts) => {
      this.optionsSignal.set(opts);
      this.loadingSignal.set(false);

      if (clearIfMissing) {
        const currentValue = this.control().value;
        if (currentValue != null && !opts.some((o) => o.id === currentValue)) {
          this.control().setValue(null);
        }
      }
    });
  }

  onCreateClick(): void {
    this.createRequested.emit();
  }
}
