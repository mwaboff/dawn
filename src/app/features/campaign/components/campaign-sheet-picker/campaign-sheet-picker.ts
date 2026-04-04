import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../shared/services/user.service';
import { CharacterSheetResponse } from '../../../create-character/models/character-sheet-api.model';

@Component({
  selector: 'app-campaign-sheet-picker',
  templateUrl: './campaign-sheet-picker.html',
  styleUrl: './campaign-sheet-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignSheetPicker implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly campaignId = input.required<number>();
  readonly excludeSheetIds = input.required<number[]>();
  readonly mode = input.required<'submit' | 'npc'>();

  readonly sheetSelected = output<number>();
  readonly cancelled = output<void>();

  readonly sheets = signal<CharacterSheetResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedSheetId = signal<number | null>(null);
  readonly submitting = signal(false);

  readonly availableSheets = computed(() => {
    const excluded = new Set(this.excludeSheetIds());
    return this.sheets().filter(s => !excluded.has(s.id));
  });

  ngOnInit(): void {
    const userId = this.authService.user()?.id;
    if (!userId) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }

    this.userService.getUserCharacterSheets(userId, 0, 100, 'subclassCards').subscribe({
        next: (res) => {
          this.sheets.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onSelect(sheetId: number): void {
    this.selectedSheetId.set(sheetId);
  }

  onConfirm(): void {
    const id = this.selectedSheetId();
    if (id !== null) {
      this.sheetSelected.emit(id);
    }
  }

  getClassNames(sheet: CharacterSheetResponse): string {
    const cards = sheet.subclassCards ?? [];
    const names = cards
      .map(c => c.associatedClassName)
      .filter((n): n is string => !!n);
    return names.length > 0 ? names.join(' / ') : '';
  }
}
