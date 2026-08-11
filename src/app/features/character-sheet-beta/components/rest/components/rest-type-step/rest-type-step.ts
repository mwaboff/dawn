import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RestType } from '../../models/rest.model';
import { SunMoonGlyph, SunMoonPhase } from '../sun-moon-glyph/sun-moon-glyph';

interface RestTypePlate {
  readonly type: RestType;
  readonly phase: SunMoonPhase;
  readonly name: string;
  readonly description: string;
}

/** The two choices as data, so the template loops once rather than carrying two near-copies. */
const PLATES: readonly RestTypePlate[] = [
  {
    type: 'short',
    phase: 'sun',
    name: 'Short rest',
    description: 'About an hour. Patch up, blow off steam, catch your breath.',
  },
  {
    type: 'long',
    phase: 'moon',
    name: 'Long rest',
    description: 'A few hours in camp. Everything clears, and there’s time for a project.',
  },
];

@Component({
  selector: 'app-rest-type-step',
  imports: [SunMoonGlyph],
  templateUrl: './rest-type-step.html',
  styleUrls: ['../../rest-step.css', './rest-type-step.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestTypeStep {
  /** Printed on the short rest plate so the numbers are real before anything is chosen. */
  readonly tier = input.required<number>();

  readonly chosen = output<RestType>();

  protected readonly plates = PLATES;
}
