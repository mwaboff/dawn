import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, debounceTime, switchMap, tap } from 'rxjs';

import { CampaignService } from '../../../../../shared/services/campaign.service';
import { SavingSpinner } from '../../../../../shared/components/saving-spinner/saving-spinner';
import { GmScreenContext } from '../../gm-screen-context.service';

const NOTES_MAX = 50_000;
const NARROW_BREAKPOINT = 700;

/**
 * GM-only session notes. This panel does NOT decide whether the user may see it -- the campaign
 * page shell gates the whole screen on `canManage`. `gmNotes` being absent from the payload means
 * *either* empty *or* not permitted, so it can never be read as a permission signal here.
 */
@Component({
  selector: 'app-gm-notes-panel',
  templateUrl: './gm-notes-panel.html',
  styleUrl: './gm-notes-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner],
  host: { '(window:resize)': 'onResize()' },
})
export class GmNotesPanel {
  private readonly context = inject(GmScreenContext);
  private readonly campaignService = inject(CampaignService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly maxLength = NOTES_MAX;
  readonly notes = this.context.gmNotes;
  readonly charCount = computed(() => this.notes().length);
  readonly saving = computed(() => this.context.isSaving('gmNotes'));
  readonly savedAt = signal<number | null>(null);

  private readonly narrow = signal(false);
  readonly rows = computed(() => (this.narrow() ? 6 : 12));

  constructor() {
    this.onResize();
    this.initSavePipeline();
  }

  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.narrow.set(window.innerWidth < NARROW_BREAKPOINT);
  }

  onInput(value: string): void {
    this.context.gmNotes.set(value.slice(0, NOTES_MAX));
    this.savedAt.set(null);
    this.context.notesSave$.next();
  }

  private initSavePipeline(): void {
    this.context.notesSave$
      .pipe(
        debounceTime(800),
        switchMap(() => {
          const id = this.context.campaignId();
          if (id === null) return EMPTY;
          const snapshot = this.context.campaign()?.gmNotes ?? '';
          this.context.markSaving('gmNotes');
          return this.campaignService.updateGmNotes(id, this.notes()).pipe(
            tap(response => {
              this.context.patchCampaign(response);
              this.context.clearSaving('gmNotes');
              this.savedAt.set(Date.now());
            }),
            catchError(() => {
              this.context.gmNotes.set(snapshot);
              this.context.clearSaving('gmNotes');
              this.savedAt.set(null);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
