import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LANDING_FEATURES } from '../../landing.model';

@Component({
  selector: 'app-landing-features',
  templateUrl: './landing-features.html',
  styleUrls: ['../../landing-type.css', './landing-features.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFeatures {
  readonly features = LANDING_FEATURES;
}
