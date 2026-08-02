import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { Density, MotionPreference } from '../../shared/models/preferences.model';

interface PreferenceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description: string;
}

const DENSITY_OPTIONS: readonly PreferenceOption<Density>[] = [
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'Larger text and roomier spacing — the default.',
  },
  {
    value: 'condensed',
    label: 'Condensed',
    description: 'Tighter spacing for experienced players who want more on screen.',
  },
];

const MOTION_OPTIONS: readonly PreferenceOption<MotionPreference>[] = [
  {
    value: 'system',
    label: 'System',
    description: "Follows your operating system's reduced-motion setting.",
  },
  {
    value: 'reduced',
    label: 'Reduced',
    description: 'Keeps animations and transitions to a minimum.',
  },
  {
    value: 'full',
    label: 'Full',
    description: 'Shows every animation and transition at its normal speed.',
  },
];

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preferences {
  private readonly preferencesService = inject(PreferencesService);

  readonly density = this.preferencesService.density;
  readonly motion = this.preferencesService.motion;

  readonly densityOptions = DENSITY_OPTIONS;
  readonly motionOptions = MOTION_OPTIONS;

  onDensityChange(value: Density): void {
    this.preferencesService.setDensity(value);
  }

  onMotionChange(value: MotionPreference): void {
    this.preferencesService.setMotion(value);
  }
}
