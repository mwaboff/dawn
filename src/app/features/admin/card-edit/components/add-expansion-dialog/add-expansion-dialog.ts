import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ExpansionService } from '../../../../../shared/services/expansion.service';
import { ExpansionOption } from '../../../../../shared/models/expansion-api.model';

export interface CreateExpansionRequest {
  name: string;
  isPublished: boolean;
}

interface ExpansionServiceWithCreate extends ExpansionService {
  createExpansion(request: CreateExpansionRequest): Observable<ExpansionOption>;
}

@Component({
  selector: 'app-add-expansion-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './add-expansion-dialog.html',
  styleUrl: './add-expansion-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExpansionDialog {
  private readonly expansionService = inject(ExpansionService) as ExpansionServiceWithCreate;

  readonly created = output<ExpansionOption>();
  readonly cancelled = output<void>();

  private readonly processing = signal(false);
  readonly isProcessing = this.processing.asReadonly();

  private readonly backendError = signal<string | null>(null);
  readonly errorMessage = this.backendError.asReadonly();

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    isPublished: new FormControl<boolean>(false, { nonNullable: true }),
  });

  get nameControl(): FormControl<string> {
    return this.form.controls.name;
  }

  onSubmit(): void {
    if (this.form.invalid || this.processing()) {
      this.form.markAllAsTouched();
      return;
    }

    this.processing.set(true);
    this.backendError.set(null);

    const { name, isPublished } = this.form.getRawValue();

    this.expansionService.createExpansion({ name, isPublished }).subscribe({
      next: (newOption) => {
        this.created.emit(newOption);
        this.form.reset();
        this.processing.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
        this.backendError.set(message);
        this.processing.set(false);
      },
    });
  }

  onCancel(): void {
    if (!this.processing()) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }
}
