import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * The collapsible countdown reference: how to design one, how big to make it, when to tick it,
 * and how to run a chase.
 *
 * Extracted from {@link CountdownsPanel} rather than left inline -- it is static reference content
 * with a single toggle, and it was the bulk of that template.
 *
 * Rules text is drawn from the Daggerheart Core Rulebook (pp. 162-164), which is substantially
 * fuller on countdowns than the SRD; the starting-value guidance and the chase variant appear
 * only there.
 */
@Component({
  selector: 'app-countdown-help',
  templateUrl: './countdown-help.html',
  styleUrl: './countdown-help.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownHelp {
  readonly open = signal(false);

  toggle(): void {
    this.open.update(open => !open);
  }
}
