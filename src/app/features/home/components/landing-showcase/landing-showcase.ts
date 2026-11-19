import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LandingStep } from '../../landing.model';
import { LandingShot } from '../landing-shot/landing-shot';

@Component({
  selector: 'app-landing-showcase',
  templateUrl: './landing-showcase.html',
  styleUrls: ['../../landing-type.css', './landing-showcase.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingShot],
  host: { '[class.reversed]': 'reversed()' },
})
export class LandingShowcase {
  readonly step = input.required<LandingStep>();
  readonly index = input.required<number>();
  /** Puts the screenshot on the left so consecutive rows alternate sides. */
  readonly reversed = input(false);
}
