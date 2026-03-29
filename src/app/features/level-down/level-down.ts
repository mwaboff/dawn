import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialog } from '../level-up/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-level-down',
  templateUrl: './level-down.html',
  styleUrl: './level-down.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog],
})
export class LevelDown implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly characterName = signal('');
  readonly characterLevel = signal(0);
  readonly showConfirmDialog = signal(false);
  readonly processing = signal(false);

  characterId = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set('Invalid character ID.');
      this.loading.set(false);
      return;
    }
    this.characterId = id;
    this.loadCharacter(id);
  }

  onLevelDownClick(): void {
    this.showConfirmDialog.set(true);
  }

  onConfirm(): void {
    this.processing.set(true);
    this.characterSheetService.undoLevelUp(this.characterId).subscribe({
      next: () => {
        this.processing.set(false);
        this.showConfirmDialog.set(false);
        this.router.navigate(['/character', this.characterId]);
      },
      error: () => {
        this.processing.set(false);
      },
    });
  }

  onCancel(): void {
    this.showConfirmDialog.set(false);
  }

  private loadCharacter(id: number): void {
    this.characterSheetService.getCharacterSheet(id).subscribe({
      next: (sheet) => {
        const user = this.authService.user();
        if (user && sheet.ownerId !== user.id) {
          this.error.set('You do not own this character.');
          this.loading.set(false);
          return;
        }
        this.characterName.set(sheet.name);
        this.characterLevel.set(sheet.level);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load character.');
        this.loading.set(false);
      },
    });
  }
}
