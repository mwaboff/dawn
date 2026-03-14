import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { mapToCharacterSheetView } from './utils/character-sheet-view.mapper';
import { CharacterSheetView, TRAIT_SUBSKILLS } from './models/character-sheet-view.model';

@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrls: ['./character-sheet.css', './character-sheet-layout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterSheetService = inject(CharacterSheetService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  private readonly expandedCardIds = signal<Set<number>>(new Set());

  private readonly localHpMarked = signal<number | null>(null);
  private readonly localStressMarked = signal<number | null>(null);
  private readonly localHopeMarked = signal<number | null>(null);
  private readonly localArmorMarked = signal<number | null>(null);
  private readonly localGoldAdjustment = signal(0);

  readonly markedHp = computed(() => this.localHpMarked() ?? (this.characterSheet()?.hitPointMarked ?? 0));
  readonly markedStress = computed(() => this.localStressMarked() ?? (this.characterSheet()?.stressMarked ?? 0));
  readonly markedHope = computed(() => this.localHopeMarked() ?? (this.characterSheet()?.hopeMarked ?? 0));
  readonly markedArmor = computed(() => this.localArmorMarked() ?? (this.characterSheet()?.armorMarked ?? 0));
  readonly currentGold = computed(() => (this.characterSheet()?.gold ?? 0) + this.localGoldAdjustment());

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.loadCharacterSheet(id);
  }

  private loadCharacterSheet(id: number): void {
    const expandFields = [
      'experiences',
      'activePrimaryWeapon',
      'activeSecondaryWeapon',
      'activeArmor',
      'communityCards',
      'ancestryCards',
      'subclassCards',
      'domainCards',
      'inventoryWeapons',
      'inventoryArmors',
      'features',
      'costTags',
      'modifiers',
    ];

    this.characterSheetService
      .getCharacterSheet(id, expandFields)
      .subscribe({
        next: (response) => {
          this.characterSheet.set(mapToCharacterSheetView(response));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  toggleResourceBox(resource: 'hp' | 'stress' | 'hope' | 'armor', index: number): void {
    const current = { hp: this.markedHp, stress: this.markedStress, hope: this.markedHope, armor: this.markedArmor }[resource]();
    const newValue = current === index ? index - 1 : index;
    switch (resource) {
      case 'hp': this.localHpMarked.set(newValue); break;
      case 'stress': this.localStressMarked.set(newValue); break;
      case 'hope': this.localHopeMarked.set(newValue); break;
      case 'armor': this.localArmorMarked.set(newValue); break;
    }
  }

  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  toggleCard(id: number): void {
    this.expandedCardIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isCardExpanded(id: number): boolean {
    return this.expandedCardIds().has(id);
  }

  getRange(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getSubSkills(traitName: string): string[] {
    return TRAIT_SUBSKILLS[traitName] ?? [];
  }

  adjustGold(amount: number): void {
    this.localGoldAdjustment.update(current => current + amount);
  }
}
