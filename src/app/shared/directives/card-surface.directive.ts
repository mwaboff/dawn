import { Directive, computed, inject, input } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';

/**
 * Whether the surface this directive is applied to has a dark card treatment available.
 * 'dark-capable' surfaces (the beta character sheet, resources/reference, the app root)
 * resolve the 'default' cardTheme preference to dark; 'light-only' surfaces (character
 * creation, level-up -- a dark background for those flows is planned later) resolve it to
 * light. An explicit 'light'/'dark' preference is absolute and renders the same on every
 * surface regardless of this input.
 */
export type CardSurfaceKind = 'dark-capable' | 'light-only';

/**
 * Scopes the card-face design tokens (`--color-card-face`, `--color-card-ink`, etc. -- see
 * `styles.css`) to this element's subtree by stamping the resolved `data-card-theme` attribute
 * on the host, mirroring what the pre-paint script and `PreferencesService` already do for
 * `<html>`. Apply it to a wrapper element around any shared card so it renders correctly on a
 * surface other than the app root.
 *
 * @example
 * <div [appCardSurface]="'light-only'">
 *   <app-daggerheart-card ... />
 * </div>
 */
@Directive({
  selector: '[appCardSurface]',
  host: {
    '[attr.data-card-theme]': 'resolvedFace()',
  },
})
export class CardSurfaceDirective {
  private readonly preferencesService = inject(PreferencesService);

  readonly appCardSurface = input.required<CardSurfaceKind>();

  readonly resolvedFace = computed(() =>
    this.appCardSurface() === 'dark-capable'
      ? this.preferencesService.darkCapableCardFace()
      : this.preferencesService.lightOnlyCardFace(),
  );
}
