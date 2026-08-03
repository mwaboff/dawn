import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { AdversaryData } from '../../../../../shared/components/adversary-card/adversary-card.model';
import { CardSkeleton } from '../../../../../shared/components/card-skeleton/card-skeleton';
import { CardError } from '../../../../../shared/components/card-error/card-error';
import { PaginationControls } from '../../../../../shared/components/pagination-controls/pagination-controls';
import { AdversaryService } from '../../../../../shared/services/adversary.service';
import { AdversaryTypeKey } from '../../../../../shared/utils/battle-points.utils';

const TIER_OPTIONS = [1, 2, 3, 4] as const;
const PAGE_SIZE = 12;

const TYPE_OPTIONS: readonly { value: AdversaryTypeKey; label: string }[] = [
  { value: 'MINION', label: 'Minion' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'HORDE', label: 'Horde' },
  { value: 'RANGED', label: 'Ranged' },
  { value: 'SKULK', label: 'Skulk' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'LEADER', label: 'Leader' },
  { value: 'BRUISER', label: 'Bruiser' },
  { value: 'SOLO', label: 'Solo' },
];

/**
 * Catalog browser for the encounter builder: multi-tier + type filtered, paginated, with an
 * "Add" action per card. Doesn't know anything about the roster it's feeding -- it just emits
 * the adversary the GM picked and lets the parent decide what an instance costs.
 */
@Component({
  selector: 'app-adversary-browser',
  templateUrl: './adversary-browser.html',
  styleUrl: './adversary-browser.css',
  imports: [AdversaryCard, CardSkeleton, CardError, PaginationControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdversaryBrowser implements OnInit {
  private readonly adversaryService = inject(AdversaryService);

  readonly adversaryAdded = output<AdversaryData>();

  readonly tierOptions = TIER_OPTIONS;
  readonly typeOptions = TYPE_OPTIONS;

  readonly selectedTiers = signal<number[]>([]);
  readonly selectedType = signal<AdversaryTypeKey | ''>('');
  readonly page = signal(0);

  readonly adversaries = signal<AdversaryData[]>([]);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.load();
  }

  isTierSelected(tier: number): boolean {
    return this.selectedTiers().includes(tier);
  }

  toggleTier(tier: number): void {
    const current = this.selectedTiers();
    this.selectedTiers.set(current.includes(tier) ? current.filter(t => t !== tier) : [...current, tier]);
    this.page.set(0);
    this.load();
  }

  onTypeChange(event: Event): void {
    this.selectedType.set((event.target as HTMLSelectElement).value as AdversaryTypeKey | '');
    this.page.set(0);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    const tiers = this.selectedTiers();

    this.adversaryService
      .getAdversaries({
        tier: tiers.length ? tiers : undefined,
        adversaryType: this.selectedType() || undefined,
        page: this.page(),
        size: PAGE_SIZE,
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.error.set(true);
          return of(null);
        }),
      )
      .subscribe(result => {
        if (result) {
          this.adversaries.set(result.adversaries);
          this.totalPages.set(result.totalPages);
        }
        this.loading.set(false);
      });
  }
}
