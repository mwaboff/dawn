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

  it('should render eight rays by default', () => {
    expect(fixture.nativeElement.querySelectorAll('.sun-moon__rays line')).toHaveLength(8);
  });

  it('should hide the rays when the moon leads', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__rays')).toBeNull();
  });

  it('should slide the moon clear of the disc for the sun phase', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__moon').getAttribute('cx')).toBe('20.5');
  });

  it('should slide the moon across the disc for the moon phase', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__moon').getAttribute('cx')).toBe('14');
  });

  it('should shrink the sun to a corona when the moon leads', () => {
    fixture.componentRef.setInput('phase', 'moon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sun-moon__disc').getAttribute('r')).toBe('5.4');
  });

  it('should expose the phase as a host class', () => {
    fixture.componentRef.setInput('phase', 'sun');
    fixture.detectChanges();

    expect(fixture.nativeElement.classList).toContain('sun-moon--sun');
  });

  it('should give each instance its own mask ids', async () => {
    const second = TestBed.createComponent(SunMoonGlyph);
    second.detectChanges();

    const first = fixture.nativeElement.querySelector('mask').getAttribute('id');
    expect(second.nativeElement.querySelector('mask').getAttribute('id')).not.toBe(first);
  });
});
