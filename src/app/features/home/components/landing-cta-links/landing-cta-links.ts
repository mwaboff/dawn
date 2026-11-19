import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LANDING_CTAS } from '../../landing.model';

@Component({
  selector: 'app-landing-cta-links',
  templateUrl: './landing-cta-links.html',
  styleUrl: './landing-cta-links.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class LandingCtaLinks {
  readonly ctas = LANDING_CTAS;
}
