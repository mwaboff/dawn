import { Component, input, output, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { CardData } from '../../../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { CardSelectionGrid } from '../../../../../../shared/components/card-selection-grid/card-selection-grid';
import { EquipmentPagination } from '../equipment-pagination/equipment-pagination';
import { ArmorService } from '../../../../services/armor.service';
import { PaginationState } from '../../../../models/equipment.model';

@Component({
  selector: 'app-armor-section',
  imports: [CardSelectionGrid, EquipmentPagination],
  templateUrl: './armor-section.html',
  styleUrl: './armor-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorSection implements OnInit {
  readonly initialArmor = input<CardData | null>(null);

  readonly armorSelected = output<CardData | null>();

  private readonly armorService = inject(ArmorService);

  readonly armorCards = signal<CardData[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly pagination = signal<PaginationState>({ currentPage: 0, totalPages: 0, totalElements: 0 });
  readonly selectedArmor = signal<CardData | null>(null);

  ngOnInit(): void {
    const armor = this.initialArmor();
    if (armor) this.selectedArmor.set(armor);
    this.loadArmor();
  }

  onCardClicked(card: CardData): void {
    if (this.selectedArmor()?.id === card.id) {
      this.selectedArmor.set(null);
    } else {
      this.selectedArmor.set(card);
    }
    this.armorSelected.emit(this.selectedArmor());
  }

  onPageChanged(page: number): void {
    this.loadArmor(page);
  }

  loadArmor(page = 0): void {
    this.loading.set(true);
    this.error.set(false);

    this.armorService.getArmors({ page, tier: 1 }).subscribe({
      next: (result) => {
        this.armorCards.set(result.cards);
        this.pagination.set({
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalElements: result.totalElements,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
