import { Component, input, output, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AdvancementConfig } from '../advancement-config/advancement-config';
import { AvailableAdvancement, AdvancementChoice, AdvancementType, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CharacterSheetView } from '../../../character-sheet/models/character-sheet-view.model';

@Component({
  selector: 'app-advancements-step',
  imports: [AdvancementConfig],
  templateUrl: './advancements-step.html',
  styleUrl: './advancements-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancementsStep implements OnInit {
  readonly availableAdvancements = input.required<AvailableAdvancement[]>();
  readonly characterSheet = input.required<CharacterSheetView>();
  readonly levelUpOptions = input.required<LevelUpOptionsResponse>();
  readonly initialAdvancements = input<AdvancementChoice[]>([]);

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

  getChoice(type: AdvancementType): AdvancementChoice | undefined {
    return this.selectedChoices().find(c => c.type === type);
  }

  needsConfig(type: AdvancementType): boolean {
    return ['BOOST_TRAITS', 'BOOST_EXPERIENCES', 'GAIN_DOMAIN_CARD', 'UPGRADE_SUBCLASS', 'MULTICLASS'].includes(type);
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

  onConfigChanged(type: AdvancementType, choice: AdvancementChoice): void {
    const updated = this.selectedChoices().map(c => c.type === type ? choice : c);
    this.selectedChoices.set(updated);
    this.advancementsChanged.emit(updated);
  }

  formatTypeLabel(type: AdvancementType): string {
    const labels: Record<AdvancementType, string> = {
      BOOST_TRAITS: 'Boost Traits',
      GAIN_HP: 'Gain HP',
      GAIN_STRESS: 'Gain Stress',
      BOOST_EXPERIENCES: 'Boost Experiences',
      GAIN_DOMAIN_CARD: 'Gain Domain Card',
      BOOST_EVASION: 'Boost Evasion',
      UPGRADE_SUBCLASS: 'Upgrade Subclass',
      BOOST_PROFICIENCY: 'Boost Proficiency',
      MULTICLASS: 'Multiclass',
    };
    return labels[type] ?? type;
  }
}
