import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Dashboard } from '../dashboard/dashboard';
import { LANDING_STEPS } from './landing.model';
import { LandingHero } from './components/landing-hero/landing-hero';
import { LandingShowcase } from './components/landing-showcase/landing-showcase';
import { LandingFeatures } from './components/landing-features/landing-features';
import { LandingClosing } from './components/landing-closing/landing-closing';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./landing-type.css', './home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dashboard, LandingHero, LandingShowcase, LandingFeatures, LandingClosing],
})
export class Home {
  private readonly authService = inject(AuthService);
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly steps = LANDING_STEPS;
}
