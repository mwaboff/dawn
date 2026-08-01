import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { isVampireTransformation, isWerewolfTransformation } from '../../utils/transformation-card.utils';

const MAX_FEED_TOKENS = 6;

/**
 * The attached transformation card, its 2 features and 6 questions, and the two card-specific
 * mechanics: Vampire's Feed token pool and Werewolf's Wolf Form toggle. Which mechanic (if any)
 * applies is driven entirely by the card's name -- see `transformation-card.utils.ts` -- since
 * neither is represented as a structured field on `TransformationCardResponse`.
 */
@Component({
  selector: 'app-transformation-panel',
  templateUrl: './transformation-panel.html',
  styleUrl: './transformation-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class TransformationPanel {
  readonly card = input.required<TransformationCardResponse>();
  readonly tokens = input<number | null>(null);
  readonly wolfFormActive = input(false);
  readonly canAct = input(false);

  readonly tokensChange = output<number>();
  readonly wolfFormToggle = output<boolean>();

  readonly isVampire = computed(() => isVampireTransformation(this.card().name));
  readonly isWerewolf = computed(() => isWerewolfTransformation(this.card().name));
  readonly currentTokens = computed(() => this.tokens() ?? 0);
  readonly features = computed(() => this.card().features ?? []);
  readonly questions = computed(() => this.card().questions ?? []);
  readonly maxTokens = MAX_FEED_TOKENS;

  adjustTokens(amount: number): void {
    if (!this.canAct()) return;
    const next = Math.min(this.maxTokens, Math.max(0, this.currentTokens() + amount));
    if (next !== this.currentTokens()) {
      this.tokensChange.emit(next);
    }
  }

  onWolfFormToggle(): void {
    if (!this.canAct()) return;
    this.wolfFormToggle.emit(!this.wolfFormActive());
  }
}
