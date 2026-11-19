import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingShot, landingShotLoader } from './landing-shot';
import { LandingShot as LandingShotData } from '../../landing.model';

const SHOT: LandingShotData = {
  src: '/landing/test.webp',
  width: 2160,
  height: 1350,
  alt: 'A test screenshot',
  caption: 'A caption for the test shot.',
  mobile: { src: '/landing/test-mobile.webp', width: 800, height: 1000 },
};

describe('LandingShot', () => {
  let fixture: ComponentFixture<LandingShot>;

  function setup(priority?: boolean): HTMLElement {
    TestBed.configureTestingModule({ imports: [LandingShot] });
    fixture = TestBed.createComponent(LandingShot);
    fixture.componentRef.setInput('shot', SHOT);
    if (priority !== undefined) fixture.componentRef.setInput('priority', priority);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the full-size image as the fallback source', () => {
    expect(setup().querySelector('img')?.getAttribute('src')).toBe(SHOT.src);
  });

  it('offers the smaller desktop exports through srcset', () => {
    const srcset = setup().querySelector('img')?.getAttribute('srcset');
    expect(srcset).toBe('/landing/test-1080.webp 1080w, /landing/test-1620.webp 1620w, /landing/test.webp 2160w');
  });

  it('serves the phone capture to small viewports', () => {
    const source = setup().querySelector('picture source');
    expect([source?.getAttribute('media'), source?.getAttribute('srcset')]).toEqual(['(max-width: 600px)', SHOT.mobile.src]);
  });

  it('reserves the phone capture’s own aspect ratio', () => {
    const source = setup().querySelector('picture source');
    expect([source?.getAttribute('width'), source?.getAttribute('height')]).toEqual(['800', '1000']);
  });

  it('renders the alt text', () => {
    expect(setup().querySelector('img')?.getAttribute('alt')).toBe(SHOT.alt);
  });

  it('reserves the intrinsic size to avoid layout shift', () => {
    const img = setup().querySelector('img');
    expect([img?.getAttribute('width'), img?.getAttribute('height')]).toEqual(['2160', '1350']);
  });

  it('renders the caption', () => {
    expect(setup().querySelector('figcaption')?.textContent?.trim()).toBe(SHOT.caption);
  });

  it('lazy-loads by default', () => {
    expect(setup().querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it('loads eagerly with high fetch priority when marked as priority', () => {
    expect(setup(true).querySelector('img')?.getAttribute('fetchpriority')).toBe('high');
  });
});

describe('landingShotLoader', () => {
  it('returns the source untouched when no width is requested', () => {
    expect(landingShotLoader({ src: '/landing/a.webp' })).toBe('/landing/a.webp');
  });

  it('maps a smaller width onto its exported file', () => {
    expect(landingShotLoader({ src: '/landing/a.webp', width: 1080 })).toBe('/landing/a-1080.webp');
  });

  it('returns the full-size file for the largest width', () => {
    expect(landingShotLoader({ src: '/landing/a.webp', width: 2160 })).toBe('/landing/a.webp');
  });
});
