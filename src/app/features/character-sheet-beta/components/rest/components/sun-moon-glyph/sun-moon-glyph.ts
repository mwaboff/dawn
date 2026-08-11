import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Which body leads the seal. Drives the moon's offset and whether the sun's rays show. */
export type SunMoonPhase = 'eclipse' | 'sun' | 'moon';

interface RayLine {
  readonly id: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const CENTRE = 12;
const RAY_INNER = 8.4;
const RAY_OUTER = 10.4;

/** Eight rays as data, so the template loops once instead of carrying eight copied elements. */
const RAY_LINES: readonly RayLine[] = Array.from({ length: 8 }, (_, index) => {
  const radians = (index * Math.PI) / 4;
  const round = (value: number): number => Math.round(value * 100) / 100;
  return {
    id: index,
    x1: round(CENTRE + RAY_INNER * Math.cos(radians)),
    y1: round(CENTRE + RAY_INNER * Math.sin(radians)),
    x2: round(CENTRE + RAY_OUTER * Math.cos(radians)),
    y2: round(CENTRE + RAY_OUTER * Math.sin(radians)),
  };
});

/** How far right of centre the moon sits, per phase. Larger means more of the sun is clear. */
const MOON_OFFSET: Readonly<Record<SunMoonPhase, number>> = { eclipse: 17, sun: 20.5, moon: 14 };

/** The sun shrinks to a corona when the moon leads. */
const SUN_RADIUS: Readonly<Record<SunMoonPhase, number>> = { eclipse: 7, sun: 7, moon: 5.4 };

let nextGlyphId = 0;

/**
 * The Rest feature's mark: a sun disc with a crescent bitten out of its upper-right edge, and the
 * moon nested into that bite. One geometry, parameterized by `phase` -- the button wears the
 * eclipse, and the two rest choices lean sun or moon -- rather than three copied SVGs.
 *
 * Drawn in `currentColor` so it inherits from whatever control hosts it, and `aria-hidden` because
 * every host supplies its own text.
 */
@Component({
  selector: 'app-sun-moon-glyph',
  templateUrl: './sun-moon-glyph.html',
  styleUrl: './sun-moon-glyph.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"sun-moon sun-moon--" + phase()' },
})
export class SunMoonGlyph {
  readonly phase = input<SunMoonPhase>('eclipse');

  /** Mask ids must be document-unique, or two glyphs on one page share a mask. */
  private readonly uid = nextGlyphId++;
  protected readonly sunMaskId = `sun-mask-${this.uid}`;
  protected readonly moonMaskId = `moon-mask-${this.uid}`;

  protected readonly rays = RAY_LINES;
  protected readonly moonCx = computed(() => MOON_OFFSET[this.phase()]);
  protected readonly sunRadius = computed(() => SUN_RADIUS[this.phase()]);

  /** The cut-out that turns the moon's disc into a crescent, offset up and to the right of it. */
  protected readonly moonCutCx = computed(() => this.moonCx() + 3.2);
}
