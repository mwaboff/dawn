import { Component, input, output, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AdvancementConfig } from '../advancement-config/advancement-config';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { AvailableAdvancement, AdvancementChoice, AdvancementType, TraitEnum, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CharacterSheetView } from '../../../character-sheet/models/character-sheet-view.model';

@Component({
  selector: 'app-advancements-step',
  imports: [AdvancementConfig, FormatTextPipe],
  templateUrl: './advancements-step.html',
  styleUrl: './advancements-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancementsStep implements OnInit {
  readonly availableAdvancements = input.required<AvailableAdvancement[]>();
  readonly characterSheet = input.required<CharacterSheetView>();
  readonly levelUpOptions = input.required<LevelUpOptionsResponse>();
  readonly initialAdvancements = input<AdvancementChoice[]>([]);
  readonly newExperienceDescription = input<string>('');

  readonly advancementsChanged = output<AdvancementChoice[]>();

  readonly selectedChoices = signal<AdvancementChoice[]>([]);

  ngOnInit(): void {
    const initial = this.initialAdvancements();
    if (initial.length > 0) {
      this.selectedChoices.set([...initial]);
    }
  }

  readonly selectedTypes = computed(() => this.selectedChoices().map(c => c.type));

  isSelected(type: AdvancementType): boolean {
    return this.selectedTypes().includes(type);
  }

  isDisabled(adv: AvailableAdvancement): boolean {
    if (adv.remaining <= 0) return true;
    const selected = this.selectedTypes();
    if (selected.length >= 2 && !selected.includes(adv.type)) return true;
    if (adv.mutuallyExclusiveWith && selected.includes(adv.mutuallyExclusiveWith)) return true;
    return false;
  }

  selectionCount(type: AdvancementType): number {
    return this.selectedChoices().filter(c => c.type === type).length;
  }

  getSelectionInstances(type: AdvancementType): number[] {
    const count = this.selectionCount(type);
    return Array.from({ length: count }, (_, i) => i);
  }

  getChoiceForInstance(type: AdvancementType, instanceIndex: number): AdvancementChoice | undefined {
    const choices = this.selectedChoices().filter(c => c.type === type);
    return choices[instanceIndex];
  }

  needsConfig(type: AdvancementType): boolean {
    return ['BOOST_TRAITS', 'BOOST_EXPERIENCES', 'UPGRADE_SUBCLASS', 'MULTICLASS'].includes(type);
  }

  canIncrement(adv: AvailableAdvancement): boolean {
    const count = this.selectionCount(adv.type);
    if (count !== 1) return false;
    if (this.selectedChoices().length >= 2) return false;
    if (adv.remaining < count + 1) return false;
    return true;
  }

  toggleAdvancement(adv: AvailableAdvancement): void {
    if (this.isDisabled(adv) && !this.isSelected(adv.type)) return;

    const current = this.selectedChoices();
    const idx = current.findIndex(c => c.type === adv.type);

    if (idx >= 0) {
      const updated = current.filter(c => c.type !== adv.type);
      this.selectedChoices.set(updated);
      this.advancementsChanged.emit(updated);
    } else if (current.length < 2) {
      const choice: AdvancementChoice = { type: adv.type };
      const updated = [...current, choice];
      this.selectedChoices.set(updated);
      if (!this.needsConfig(adv.type)) {
        this.advancementsChanged.emit(updated);
      }
    }
  }

  incrementAdvancement(adv: AvailableAdvancement, event: Event): void {
    event.stopPropagation();
    if (!this.canIncrement(adv)) return;

    const choice: AdvancementChoice = { type: adv.type };
    const updated = [...this.selectedChoices(), choice];
    this.selectedChoices.set(updated);
    if (!this.needsConfig(adv.type)) {
      this.advancementsChanged.emit(updated);
    }
  }

  decrementAdvancement(adv: AvailableAdvancement, event: Event): void {
    event.stopPropagation();
    const current = this.selectedChoices();
    const lastIdx = current.map(c => c.type).lastIndexOf(adv.type);
    if (lastIdx < 0) return;

    const updated = current.filter((_, i) => i !== lastIdx);
    this.selectedChoices.set(updated);
    this.advancementsChanged.emit(updated);
  }

  onConfigChangedForInstance(type: AdvancementType, instanceIndex: number, choice: AdvancementChoice): void {
    const current = this.selectedChoices();
    let matchIndex = 0;
    const updated = current.map(c => {
      if (c.type === type) {
        if (matchIndex === instanceIndex) {
          matchIndex++;
          return choice;
        }
        matchIndex++;
      }
      return c;
    });
    this.selectedChoices.set(updated);
    this.advancementsChanged.emit(updated);
  }

  getExcludedTraits(instanceIndex: number): TraitEnum[] {
    const choices = this.selectedChoices().filter(c => c.type === 'BOOST_TRAITS');
    return choices
      .filter((_, i) => i !== instanceIndex)
      .flatMap(c => c.traits ?? []);
  }

  isExclusiveVisible(exclusiveType: AdvancementType): boolean {
    return this.availableAdvancements().some(a => a.type === exclusiveType);
  }

  getStatArrow(type: AdvancementType): string | null {
    const count = this.selectionCount(type);
    if (count === 0) return null;
    const sheet = this.characterSheet();
    if (type === 'GAIN_HP') {
      const cur = sheet.hitPointMax.modified;
      return `${cur} → ${cur + count}`;
    }
    if (type === 'GAIN_STRESS') {
      const cur = sheet.stressMax.modified;
      return `${cur} → ${cur + count}`;
    }
    if (type === 'BOOST_EVASION') {
      const base = sheet.evasion.base;
      const modified = sheet.evasion.modified;
      if (sheet.evasion.hasModifier) {
        return `Base ${base} → ${base + count}, Total ${modified} → ${modified + count}`;
      }
      return `${base} → ${base + count}`;
    }
    if (type === 'BOOST_PROFICIENCY') {
      const cur = sheet.proficiency.modified;
      return `${cur} → ${cur + count}`;
    }
    return null;
  }

  formatTypeLabel(type: AdvancementType): string {
    const labels: Record<AdvancementType, string> = {
      BOOST_TRAITS: 'Boost Traits',
      GAIN_HP: 'Boost HP Max',
      GAIN_STRESS: 'Boost Stress Max',
      BOOST_EXPERIENCES: 'Boost Experiences',
      GAIN_DOMAIN_CARD: 'Gain Extra Domain Card',
      BOOST_EVASION: 'Boost Evasion',
      UPGRADE_SUBCLASS: 'Upgrade Subclass',
      BOOST_PROFICIENCY: 'Boost Proficiency',
      MULTICLASS: 'Multiclass',
    };
    return labels[type] ?? type;
  }
}
