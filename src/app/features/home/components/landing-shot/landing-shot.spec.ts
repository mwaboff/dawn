import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingShot } from './landing-shot';
import { LandingShot as LandingShotData } from '../../landing.model';

const SHOT: LandingShotData = {
  src: '/landing/test.webp',
  width: 2160,
  height: 1350,
  alt: 'A test screenshot',
  caption: 'A caption for the test shot.',
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

  it('renders the image source', () => {
    const img = setup().querySelector('img');
    expect(img?.getAttribute('src')).toBe(SHOT.src);
  });

  it('renders the alt text', () => {
    const img = setup().querySelector('img');
    expect(img?.getAttribute('alt')).toBe(SHOT.alt);
  });

  it('reserves the intrinsic size to avoid layout shift', () => {
    const img = setup().querySelector('img');
    expect([img?.getAttribute('width'), img?.getAttribute('height')]).toEqual(['2160', '1350']);
  });

  it('renders the caption', () => {
    const caption = setup().querySelector('figcaption');
    expect(caption?.textContent?.trim()).toBe(SHOT.caption);
  });

  it('lazy-loads by default', () => {
    const img = setup().querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });

  it('loads eagerly with high fetch priority when marked as priority', () => {
    const img = setup(true).querySelector('img');
    expect(img?.getAttribute('fetchpriority')).toBe('high');
  });
});
