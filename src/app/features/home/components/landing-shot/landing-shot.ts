import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { LANDING_SHOT_WIDTHS, LandingShot as LandingShotData } from '../../landing.model';

const FULL_WIDTH = LANDING_SHOT_WIDTHS[LANDING_SHOT_WIDTHS.length - 1];

/** Maps a requested width onto the pre-exported `{name}-{width}.webp` beside each full-size shot. */
export function landingShotLoader({ src, width }: ImageLoaderConfig): string {
  return width && width < FULL_WIDTH ? src.replace(/\.webp$/, `-${width}.webp`) : src;
}

/**
 * A framed screenshot. Phones get a portrait capture through `<picture>`; NgOptimizedImage has no
 * art-direction support, so in dev mode at phone width it logs NG02952 (the 4:5 phone image doesn't
 * match the img's 16:10 width/height). That check is dev-only and the warning is expected.
 */
@Component({
  selector: 'app-landing-shot',
  templateUrl: './landing-shot.html',
  styleUrl: './landing-shot.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  providers: [{ provide: IMAGE_LOADER, useValue: landingShotLoader }],
})
export class LandingShot {
  readonly shot = input.required<LandingShotData>();
  /** Above-the-fold images load eagerly with high fetch priority. */
  readonly priority = input(false);
  /** The `sizes` hint for the desktop shot, so the browser picks the smallest export that fits. */
  readonly sizes = input('(max-width: 900px) 100vw, 790px');
  readonly srcset = LANDING_SHOT_WIDTHS.map(w => `${w}w`).join(', ');
}
