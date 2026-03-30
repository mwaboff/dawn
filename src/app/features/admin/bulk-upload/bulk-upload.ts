import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminCardService } from '../../../shared/services/admin-card.service';

interface UploadResult {
  success: boolean;
  count?: number;
  error?: string;
}

const CARD_TYPE_OPTIONS = [
  { value: 'class', label: 'Classes' },
  { value: 'subclass', label: 'Subclasses' },
  { value: 'ancestry', label: 'Ancestries' },
  { value: 'community', label: 'Communities' },
  { value: 'domain', label: 'Domains' },
  { value: 'domainCard', label: 'Domain Cards' },
  { value: 'weapon', label: 'Weapons' },
  { value: 'armor', label: 'Armor' },
  { value: 'loot', label: 'Loot' },
  { value: 'companion', label: 'Companions' },
  { value: 'subclassPath', label: 'Subclass Paths' },
  { value: 'adversary', label: 'Adversaries' },
  { value: 'feature', label: 'Features' },
];

@Component({
  selector: 'app-bulk-upload',
  templateUrl: './bulk-upload.html',
  styleUrl: './bulk-upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class BulkUpload {
  private readonly adminCardService = inject(AdminCardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cardTypeOptions = CARD_TYPE_OPTIONS;
  readonly selectedType = signal('');
  readonly jsonInput = signal('');
  readonly validationError = signal('');
  readonly validationSuccess = signal('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResult | null>(null);

  readonly canValidate = computed(() => this.selectedType() !== '' && this.jsonInput().trim() !== '');
  readonly canUpload = computed(() => this.validationSuccess() !== '' && this.validationError() === '' && !this.uploading());

  onTypeChange(value: string): void {
    this.selectedType.set(value);
    this.resetValidation();
  }

  onJsonChange(value: string): void {
    this.jsonInput.set(value);
    this.resetValidation();
  }

  onValidate(): void {
    this.uploadResult.set(null);
    this.validationError.set('');
    this.validationSuccess.set('');

    const raw = this.jsonInput().trim();
    if (!raw) {
      this.validationError.set('JSON input is required.');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        this.validationError.set('JSON must be an array of objects.');
        return;
      }
      if (parsed.length === 0) {
        this.validationError.set('Array is empty. Nothing to upload.');
        return;
      }
      this.validationSuccess.set(`Valid JSON array with ${parsed.length} item${parsed.length === 1 ? '' : 's'}.`);
    } catch (e) {
      this.validationError.set(`Invalid JSON: ${(e as SyntaxError).message}`);
    }
  }

  onUpload(): void {
    const parsed = JSON.parse(this.jsonInput().trim()) as unknown[];
    this.uploading.set(true);
    this.uploadResult.set(null);

    this.adminCardService.bulkCreate(this.selectedType(), parsed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.uploading.set(false);
          this.uploadResult.set({ success: true, count: parsed.length });
        },
        error: (err) => {
          this.uploading.set(false);
          this.uploadResult.set({
            success: false,
            error: err?.error?.message || err?.message || 'Upload failed. Please try again.',
          });
        },
      });
  }

  onClear(): void {
    this.jsonInput.set('');
    this.resetValidation();
    this.uploadResult.set(null);
  }

  private resetValidation(): void {
    this.validationError.set('');
    this.validationSuccess.set('');
    this.uploadResult.set(null);
  }
}
