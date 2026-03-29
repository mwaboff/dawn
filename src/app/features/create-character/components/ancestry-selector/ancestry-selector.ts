import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CardSelectionGrid } from '../../../../shared/components/card-selection-grid/card-selection-grid';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { CardData, CardFeature } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

export interface MixedAncestrySelection {
  ancestry1: CardData;
  ancestry2: CardData;
  feature1: CardFeature;
  feature2: CardFeature;
  expansionId: number;
}

@Component({
  selector: 'app-ancestry-selector',
  imports: [CardSelectionGrid, FormatTextPipe],
  templateUrl: './ancestry-selector.html',
  styleUrl: './ancestry-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AncestrySelector {
  readonly cards = input.required<CardData[]>();
  readonly loading = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly selectedCard = input<CardData>();

  readonly ancestrySelected = output<CardData>();
  readonly mixedAncestrySelected = output<MixedAncestrySelection>();
  readonly ancestryDeselected = output<void>();

  readonly mode = signal<'single' | 'mixed'>('single');
  readonly mixedStep = signal<'pick-ancestries' | 'pick-features'>('pick-ancestries');
  readonly selectedAncestries = signal<CardData[]>([]);
  private readonly selectedFeaturesMap = signal<Map<number, CardFeature>>(new Map());

  readonly canProceedToFeatures = computed(() => this.selectedAncestries().length === 2);
  readonly mixedSelectionComplete = computed(() => this.selectedFeaturesMap().size === 2);
  readonly mixedName = computed(() => {
    const a = this.selectedAncestries();
    return a.length === 2 ? `${a[0].name} / ${a[1].name}` : '';
  });

  setMode(newMode: 'single' | 'mixed'): void {
    this.mode.set(newMode);
    if (newMode === 'single') {
      this.resetMixedState();
    } else {
      this.ancestryDeselected.emit();
    }
  }

  onSingleAncestrySelected(card: CardData): void {
    if (this.selectedCard()?.id === card.id) {
      this.ancestryDeselected.emit();
    } else {
      this.ancestrySelected.emit(card);
    }
  }

  onAncestriesSelected(cards: CardData[]): void {
    this.selectedAncestries.set(cards);
    if (cards.length < 2) {
      this.selectedFeaturesMap.set(new Map());
      this.mixedStep.set('pick-ancestries');
    }
  }

  proceedToFeatures(): void {
    this.mixedStep.set('pick-features');
  }

  backToAncestries(): void {
    this.selectedFeaturesMap.set(new Map());
    this.mixedStep.set('pick-ancestries');
  }

  isFeatureSelected(ancestryId: number, feature: CardFeature): boolean {
    const selected = this.selectedFeaturesMap().get(ancestryId);
    return selected?.name === feature.name;
  }

  toggleFeature(ancestryId: number, feature: CardFeature): void {
    const current = new Map(this.selectedFeaturesMap());
    if (current.get(ancestryId)?.name === feature.name) {
      current.delete(ancestryId);
    } else {
      current.set(ancestryId, feature);
    }
    this.selectedFeaturesMap.set(current);
  }

  confirmMixedSelection(): void {
    const ancestries = this.selectedAncestries();
    const features = this.selectedFeaturesMap();
    if (ancestries.length !== 2 || features.size !== 2) return;

    const feature1 = features.get(ancestries[0].id)!;
    const feature2 = features.get(ancestries[1].id)!;
    const expansionId = (ancestries[0].metadata?.['expansionId'] as number) ?? 1;

    this.mixedAncestrySelected.emit({
      ancestry1: ancestries[0],
      ancestry2: ancestries[1],
      feature1,
      feature2,
      expansionId,
    });
  }

  private resetMixedState(): void {
    this.selectedAncestries.set([]);
    this.selectedFeaturesMap.set(new Map());
    this.mixedStep.set('pick-ancestries');
  }
}
