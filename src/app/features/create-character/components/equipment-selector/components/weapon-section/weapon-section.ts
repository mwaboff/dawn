import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { CardData } from '../../../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { CardSelectionGrid } from '../../../../../../shared/components/card-selection-grid/card-selection-grid';
import { EquipmentPagination } from '../equipment-pagination/equipment-pagination';
import { WeaponService } from '../../../../services/weapon.service';
import { PaginationState } from '../../../../models/equipment.model';

@Component({
  selector: 'app-weapon-section',
  imports: [CardSelectionGrid, EquipmentPagination],
  templateUrl: './weapon-section.html',
  styleUrl: './weapon-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponSection implements OnInit {
  readonly hasMagicAccess = input<boolean>(false);
  readonly initialPrimary = input<CardData | null>(null);
  readonly initialSecondary = input<CardData | null>(null);

  readonly weaponSelected = output<{ primary: CardData | null; secondary: CardData | null }>();

  private readonly weaponService = inject(WeaponService);

  readonly weaponSlot = signal<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  readonly damageFilter = signal<'PHYSICAL' | 'MAGIC'>('PHYSICAL');

  readonly primaryWeapons = signal<CardData[]>([]);
  readonly primaryLoading = signal(false);
  readonly primaryError = signal(false);
  readonly primaryPagination = signal<PaginationState>({ currentPage: 0, totalPages: 0, totalElements: 0 });

  readonly secondaryWeapons = signal<CardData[]>([]);
  readonly secondaryLoading = signal(false);
  readonly secondaryError = signal(false);
  readonly secondaryPagination = signal<PaginationState>({ currentPage: 0, totalPages: 0, totalElements: 0 });

  readonly selectedPrimary = signal<CardData | null>(null);
  readonly selectedSecondary = signal<CardData | null>(null);

  readonly canSelectSecondary = computed(() => this.selectedPrimary()?.metadata?.['burden'] === 'ONE_HANDED');

  readonly activeWeapons = computed(() =>
    this.weaponSlot() === 'PRIMARY' ? this.primaryWeapons() : this.secondaryWeapons(),
  );
  readonly activeLoading = computed(() =>
    this.weaponSlot() === 'PRIMARY' ? this.primaryLoading() : this.secondaryLoading(),
  );
  readonly activeError = computed(() =>
    this.weaponSlot() === 'PRIMARY' ? this.primaryError() : this.secondaryError(),
  );
  readonly activePagination = computed(() =>
    this.weaponSlot() === 'PRIMARY' ? this.primaryPagination() : this.secondaryPagination(),
  );
  readonly activeSelected = computed(() =>
    this.weaponSlot() === 'PRIMARY' ? this.selectedPrimary() : this.selectedSecondary(),
  );

  ngOnInit(): void {
    const primary = this.initialPrimary();
    const secondary = this.initialSecondary();
    if (primary) this.selectedPrimary.set(primary);
    if (secondary) this.selectedSecondary.set(secondary);
    this.loadPrimaryWeapons();
  }

  onSlotChange(slot: 'PRIMARY' | 'SECONDARY'): void {
    if (slot === 'SECONDARY' && !this.canSelectSecondary()) return;
    this.weaponSlot.set(slot);
    if (slot === 'SECONDARY') {
      this.loadSecondaryWeapons();
    }
  }

  onCardClicked(card: CardData): void {
    if (this.weaponSlot() === 'PRIMARY') {
      this.onPrimaryCardClicked(card);
    } else {
      this.onSecondaryCardClicked(card);
    }
  }

  onPageChanged(page: number): void {
    if (this.weaponSlot() === 'PRIMARY') {
      this.loadPrimaryWeapons(page);
    } else {
      this.loadSecondaryWeapons(page);
    }
  }

  onPrimaryCardClicked(card: CardData): void {
    const current = this.selectedPrimary();
    if (current?.id === card.id) {
      this.selectedPrimary.set(null);
      this.selectedSecondary.set(null);
      this.emitSelection();
      return;
    }

    this.selectedPrimary.set(card);

    if (card.metadata?.['burden'] === 'TWO_HANDED') {
      this.selectedSecondary.set(null);
    }

    this.emitSelection();
  }

  onSecondaryCardClicked(card: CardData): void {
    const current = this.selectedSecondary();
    if (current?.id === card.id) {
      this.selectedSecondary.set(null);
    } else {
      this.selectedSecondary.set(card);
    }
    this.emitSelection();
  }

  onDamageFilterChange(damageType: 'PHYSICAL' | 'MAGIC'): void {
    if (damageType === 'MAGIC' && !this.hasMagicAccess()) return;
    this.damageFilter.set(damageType);

    if (this.weaponSlot() === 'PRIMARY') {
      this.loadPrimaryWeapons();
    } else {
      this.loadSecondaryWeapons();
    }

    this.emitSelection();
  }

  loadPrimaryWeapons(page = 0): void {
    this.primaryLoading.set(true);
    this.primaryError.set(false);

    this.weaponService.getWeapons({
      page,
      isPrimary: true,
      tier: 1,
      damageType: this.damageFilter(),
    }).subscribe({
      next: (result) => {
        this.primaryWeapons.set(result.cards);
        this.primaryPagination.set({
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalElements: result.totalElements,
        });
        this.primaryLoading.set(false);
      },
      error: () => {
        this.primaryError.set(true);
        this.primaryLoading.set(false);
      },
    });
  }

  loadSecondaryWeapons(page = 0): void {
    this.secondaryLoading.set(true);
    this.secondaryError.set(false);

    this.weaponService.getWeapons({
      page,
      isPrimary: false,
      tier: 1,
      damageType: this.damageFilter(),
    }).subscribe({
      next: (result) => {
        this.secondaryWeapons.set(result.cards);
        this.secondaryPagination.set({
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalElements: result.totalElements,
        });
        this.secondaryLoading.set(false);
      },
      error: () => {
        this.secondaryError.set(true);
        this.secondaryLoading.set(false);
      },
    });
  }

  private emitSelection(): void {
    this.weaponSelected.emit({
      primary: this.selectedPrimary(),
      secondary: this.selectedSecondary(),
    });
  }
}
