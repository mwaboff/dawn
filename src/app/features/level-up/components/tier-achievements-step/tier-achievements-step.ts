import { Component, input, output, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tier-achievements-step',
  templateUrl: './tier-achievements-step.html',
  styleUrl: './tier-achievements-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierAchievementsStep implements OnInit {
  readonly nextLevel = input.required<number>();
  readonly currentTier = input.required<number>();
  readonly nextTier = input.required<number>();
  readonly initialDescription = input<string>('');

  readonly experienceDescriptionChanged = output<string>();

  readonly description = signal('');

  ngOnInit(): void {
    if (this.initialDescription()) {
      this.description.set(this.initialDescription());
    }
  }

  readonly clearsMarkedTraits = (() => {
    return [5, 8];
  })();

  onDescriptionInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.description.set(value);
    this.experienceDescriptionChanged.emit(value);
  }
}
