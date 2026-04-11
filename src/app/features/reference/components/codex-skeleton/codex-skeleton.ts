import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CardSkeleton } from '../../../../shared/components/card-skeleton/card-skeleton';

export type CodexSkeletonVariant = 'mixed' | 'focused';

@Component({
  selector: 'app-codex-skeleton',
  templateUrl: './codex-skeleton.html',
  styleUrl: './codex-skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardSkeleton],
})
export class CodexSkeleton {
  readonly variant = input<CodexSkeletonVariant>('mixed');
  readonly count = input<number | null>(null);

  readonly skeletonCount = computed<number>(() => {
    const explicit = this.count();
    if (explicit !== null) return explicit;
    return this.variant() === 'focused' ? 6 : 3;
  });
}
