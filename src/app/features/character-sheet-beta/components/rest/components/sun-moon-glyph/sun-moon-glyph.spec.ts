import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SunMoonGlyph } from './sun-moon-glyph';

describe('SunMoonGlyph', () => {
  let fixture: ComponentFixture<SunMoonGlyph>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SunMoonGlyph] }).compileComponents();
    fixture = TestBed.createComponent(SunMoonGlyph);
    fixture.detectChanges();
  });

  function svg(): SVGElement {
    return fixture.nativeElement.querySelector('svg');
  }

  it('should hide the seal from assistive technology', () => {
    expect(svg().getAttribute('aria-hidden')).toBe('true');
  });

  it('should drop the rays that would hang in the moon’s bite with nothing to attach to', () => {
    expect(fixture.nativeElement.querySelectorAll('.sun-moon__rays line')).toHaveLength(6);
  });

  it('should drop the same orphaned rays when the sun leads', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.sun-moon__rays line')).toHaveLength(6);
  });

  it('should hide the rays when the moon leads', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__rays')).toBeNull();
  });

  it('should slide the moon clear of the disc for the sun phase', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__moon').getAttribute('cx')).toBe('19');
  });

  it('should shrink the moon when the sun leads, so one body reads as dominant', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__moon').getAttribute('r')).toBe('4.6');
  });

  it('should keep the moon’s far horn inside the viewBox', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();
    const moon = fixture.nativeElement.querySelector('.sun-moon__moon');

    const farHorn = Number(moon.getAttribute('cx')) + Number(moon.getAttribute('r'));

    expect(farHorn).toBeLessThanOrEqual(24);
  });

  it('should slide the moon across the disc for the moon phase', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__moon').getAttribute('cx')).toBe('14');
  });

  /** 2.83 (centre distance) + 3.2 < 6.2, so the mask swallows the sun and the mark is a pure
   *  crescent rather than a crescent plus a 1.5px corona hairline. */
  it('should hide the sun entirely behind the moon at the moon phase', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();
    const disc = fixture.nativeElement.querySelector('.sun-moon__disc');
    const moon = fixture.nativeElement.querySelector('.sun-moon__moon');
    const centreDistance = Math.hypot(12 - Number(moon.getAttribute('cx')), 12 - 10);

    const reach = centreDistance + Number(disc.getAttribute('r'));

    expect(reach).toBeLessThanOrEqual(Number(moon.getAttribute('r')));
  });

  it('should give each instance its own mask ids', async () => {
    const second = TestBed.createComponent(SunMoonGlyph);
    second.detectChanges();

    const first = fixture.nativeElement.querySelector('mask').getAttribute('id');
    expect(second.nativeElement.querySelector('mask').getAttribute('id')).not.toBe(first);
  });
});
