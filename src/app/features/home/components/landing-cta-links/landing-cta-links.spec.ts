import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingCtaLinks } from './landing-cta-links';
import { LANDING_CTAS } from '../../landing.model';

describe('LandingCtaLinks', () => {
  function setup(): HTMLAnchorElement[] {
    TestBed.configureTestingModule({ imports: [LandingCtaLinks], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LandingCtaLinks);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a'));
  }

  it('renders one link per call to action', () => {
    expect(setup().length).toBe(LANDING_CTAS.length);
  });

  it('points each link at its route', () => {
    expect(setup().map(a => a.getAttribute('href'))).toEqual(LANDING_CTAS.map(c => c.route));
  });

  it('labels each link', () => {
    expect(setup().map(a => a.textContent?.trim())).toEqual(LANDING_CTAS.map(c => c.label));
  });

  it('styles the sign-in link as the primary button', () => {
    const signIn = setup().find(a => a.getAttribute('href') === '/auth');
    expect(signIn?.classList.contains('btn--primary')).toBe(true);
  });

  it('styles the codex link as a secondary button', () => {
    const codex = setup().find(a => a.getAttribute('href') === '/reference');
    expect(codex?.classList.contains('btn--secondary')).toBe(true);
  });
});
