import { TestBed } from '@angular/core/testing';
import { LandingFeatures } from './landing-features';
import { LANDING_FEATURES } from '../../landing.model';

describe('LandingFeatures', () => {
  function setup(): HTMLElement {
    TestBed.configureTestingModule({ imports: [LandingFeatures] });
    const fixture = TestBed.createComponent(LandingFeatures);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one item per feature', () => {
    expect(setup().querySelectorAll('li.feature').length).toBe(LANDING_FEATURES.length);
  });

  it('renders each feature title', () => {
    const titles = Array.from(setup().querySelectorAll('.feature__title')).map(t => t.textContent?.trim());
    expect(titles).toEqual(LANDING_FEATURES.map(f => f.title));
  });

  it('renders every icon path for a feature', () => {
    const firstIcon = setup().querySelector('li.feature svg');
    expect(firstIcon?.querySelectorAll('path').length).toBe(LANDING_FEATURES[0].iconPaths.length);
  });

  it('hides icons from assistive technology', () => {
    const icons = Array.from(setup().querySelectorAll('svg'));
    expect(icons.every(icon => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});
