import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { CardTheme, Density, MotionPreference, SheetLayout } from '../../shared/models/preferences.model';

interface PreferenceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description: string;
  readonly badge?: string;
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

const SHEET_LAYOUT_OPTIONS: readonly PreferenceOption<SheetLayout>[] = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'The original character sheet layout — the default.',
  },
  {
    value: 'beta',
    label: 'Beta',
    description: 'An early look at the redesigned character sheet layout, still under active development.',
  },
];

const CARD_THEME_OPTIONS: readonly PreferenceOption<CardTheme>[] = [
  {
    value: 'default',
    label: 'Default',
    description:
      'Dark cards wherever the site has a dark look to match, light cards everywhere else — ' +
      'the default. As more of the site gets a dark treatment, this follows along automatically.',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Dark ink on a pale card face, everywhere.',
    badge: 'Beta',
  },
  {
    value: 'dark',
    label: 'Dark',
    description:
      'Pale ink on a dark card face, everywhere. Character creation and levelling up don\'t ' +
      'have a dark page to match yet, so the card will stand out against its lighter background there.',
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
  readonly sheetLayout = this.preferencesService.sheetLayout;
  readonly cardTheme = this.preferencesService.cardTheme;

  readonly densityOptions = DENSITY_OPTIONS;
  readonly motionOptions = MOTION_OPTIONS;
  readonly sheetLayoutOptions = SHEET_LAYOUT_OPTIONS;
  readonly cardThemeOptions = CARD_THEME_OPTIONS;

  onDensityChange(value: Density): void {
    this.preferencesService.setDensity(value);
  }

  onMotionChange(value: MotionPreference): void {
    this.preferencesService.setMotion(value);
  }

  onSheetLayoutChange(value: SheetLayout): void {
    this.preferencesService.setSheetLayout(value);
  }

  onCardThemeChange(value: CardTheme): void {
    this.preferencesService.setCardTheme(value);
  }
}
