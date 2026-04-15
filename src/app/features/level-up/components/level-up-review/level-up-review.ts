import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { AdvancementChoice, AdvancementType, TradeDisplayPair, LevelUpOptionsResponse } from '../../models/level-up-api.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

@Component({
  selector: 'app-level-up-review',
  templateUrl: './level-up-review.html',
  styleUrl: './level-up-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelUpReview {
  readonly levelUpOptions = input.required<LevelUpOptionsResponse>();
  readonly advancements = input.required<AdvancementChoice[]>();
  readonly newExperienceDescription = input<string>('');
  readonly selectedDomainCards = input.required<CardData[]>();
  readonly equipNewDomainCard = input<boolean>(false);
  readonly tradeDisplayPairs = input<TradeDisplayPair[]>([]);
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);

  readonly submitClicked = output<void>();

  formatAdvancementType(type: AdvancementType): string {
    const labels: Record<AdvancementType, string> = {
      BOOST_TRAITS: 'Boost Traits',
      GAIN_HP: '+1 Hit Points',
      GAIN_STRESS: '+1 Stress',
      BOOST_EXPERIENCES: 'Boost Experiences',
      GAIN_DOMAIN_CARD: 'Gain Extra Domain Card',
      BOOST_EVASION: '+1 Evasion',
      UPGRADE_SUBCLASS: 'Upgrade Subclass',
      BOOST_PROFICIENCY: '+1 Proficiency',
      MULTICLASS: 'Multiclass',
      FEATURE_DOMAIN_CARD: 'Bonus Domain Card',
    };
    return labels[type] ?? type;
  }

  formatAdvancementDetail(choice: AdvancementChoice): string {
    switch (choice.type) {
      case 'BOOST_TRAITS':
        return choice.traits?.join(', ') ?? '';
      case 'BOOST_EXPERIENCES': {
        const count = (choice.experienceIds?.length ?? 0) + (choice.boostNewExperience ? 1 : 0);
        return `${count} experience${count !== 1 ? 's' : ''} boosted`;
      }
      case 'GAIN_DOMAIN_CARD':
        return '';
      case 'UPGRADE_SUBCLASS':
        return `Card #${choice.subclassCardId}`;
      case 'MULTICLASS':
        return `Card #${choice.subclassCardId}`;
      default:
        return 'Automatic';
    }
  }

  onSubmit(): void {
    if (!this.submitting()) {
      this.submitClicked.emit();
    }
  }
}
