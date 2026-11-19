import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingCtaLinks } from '../landing-cta-links/landing-cta-links';

@Component({
  selector: 'app-landing-closing',
  templateUrl: './landing-closing.html',
  styleUrls: ['../../landing-type.css', './landing-closing.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingCtaLinks],
})
export class LandingClosing {}
