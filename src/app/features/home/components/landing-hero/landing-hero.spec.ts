import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingHero } from './landing-hero';
import { HERO_SHOT } from '../../landing.model';

describe('LandingHero', () => {
  function setup(): HTMLElement {
    TestBed.configureTestingModule({ imports: [LandingHero], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LandingHero);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the page title as the only h1', () => {
    expect(setup().querySelectorAll('h1').length).toBe(1);
  });

  it('labels the hero section with its title', () => {
    const el = setup();
    const labelledBy = el.querySelector('section')?.getAttribute('aria-labelledby');
    expect(el.querySelector(`#${labelledBy}`)?.tagName).toBe('H1');
  });

  it('renders the calls to action', () => {
    expect(setup().querySelector('app-landing-cta-links')).toBeTruthy();
  });

  it('renders the hero screenshot', () => {
    expect(setup().querySelector('img')?.getAttribute('src')).toBe(HERO_SHOT.src);
  });

  it('loads the hero screenshot with high priority', () => {
    expect(setup().querySelector('img')?.getAttribute('fetchpriority')).toBe('high');
  });

  it('hides the decorative grain from assistive technology', () => {
    expect(setup().querySelector('.grain-overlay')?.getAttribute('aria-hidden')).toBe('true');
  });
});
