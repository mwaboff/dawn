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
const MOON_OFFSET: Readonly<Record<SunMoonPhase, number>> = { eclipse: 17, sun: 19, moon: 14 };

/**
 * At the moon phase the sun is small enough to sit entirely inside the moon's disc (2.83 + 3.2 <
 * 6.2), so the mask swallows it and the mark becomes a clean crescent. A partly-eclipsed sun here
 * left a 2-unit corona that was a 1.5px hairline at small sizes -- an accent nobody could see.
 */
const SUN_RADIUS: Readonly<Record<SunMoonPhase, number>> = { eclipse: 7, sun: 7, moon: 3.2 };

/**
 * The moon shrinks when the sun leads, so 'sun' reads as the sun leading rather than as two bodies
 * of equal weight. Also keeps the crescent's far horn inside the 24-unit box.
 */
const MOON_RADIUS: Readonly<Record<SunMoonPhase, number>> = { eclipse: 6.2, sun: 4.6, moon: 6.2 };

const moonCutCx = (cx: number, r: number): number => cx + r * 0.52;
const moonCutR = (r: number): number => r * 0.935;

function within(x: number, y: number, cx: number, cy: number, r: number): boolean {
  return Math.hypot(x - cx, y - cy) < r;
}

/**
 * Rays are painted around the sun's full circle, but the moon's bite removes the sun wherever the
 * moon's disc covers it. A ray rooted inside that bite but outside the crescent filling it has
 * nothing to attach to and hangs in the notch as a detached dash. Derived rather than hardcoded so
 * it stays correct if the offsets above are ever retuned.
 */
function visibleRays(phase: SunMoonPhase): readonly RayLine[] {
  const cx = MOON_OFFSET[phase];
  const r = MOON_RADIUS[phase];
  const cutCx = moonCutCx(cx, r);
  const cutR = moonCutR(r);
  return RAY_LINES.filter(
    ray => !(within(ray.x1, ray.y1, cx, 10, r) && within(ray.x1, ray.y1, cutCx, 8.6, cutR)),
  );
}

const RAYS_BY_PHASE: Readonly<Record<SunMoonPhase, readonly RayLine[]>> = {
  eclipse: visibleRays('eclipse'),
  sun: visibleRays('sun'),
  /* No rays at all once the moon leads -- it is night. */
  moon: [],
};

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
})
export class SunMoonGlyph {
  readonly phase = input<SunMoonPhase>('eclipse');

  /** Mask ids must be document-unique, or two glyphs on one page share a mask. */
  private readonly uid = nextGlyphId++;
  protected readonly sunMaskId = `sun-mask-${this.uid}`;
  protected readonly moonMaskId = `moon-mask-${this.uid}`;

  protected readonly rays = computed(() => RAYS_BY_PHASE[this.phase()]);
  protected readonly moonCx = computed(() => MOON_OFFSET[this.phase()]);
  protected readonly moonR = computed(() => MOON_RADIUS[this.phase()]);
  protected readonly sunRadius = computed(() => SUN_RADIUS[this.phase()]);

  /** The cut-out that turns the moon's disc into a crescent, offset up and to the right of it. */
  protected readonly moonCutCx = computed(() => moonCutCx(this.moonCx(), this.moonR()));
  protected readonly moonCutR = computed(() => moonCutR(this.moonR()));
}
