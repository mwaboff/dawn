import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HERO_SHOT } from '../../landing.model';
import { LandingCtaLinks } from '../landing-cta-links/landing-cta-links';
import { LandingShot } from '../landing-shot/landing-shot';

@Component({
  selector: 'app-landing-hero',
  templateUrl: './landing-hero.html',
  styleUrls: ['../../landing-type.css', './landing-hero.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingCtaLinks, LandingShot],
})
export class LandingHero {
  readonly shot = HERO_SHOT;
}
