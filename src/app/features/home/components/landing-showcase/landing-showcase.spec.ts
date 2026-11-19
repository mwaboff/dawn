import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingShowcase } from './landing-showcase';
import { LANDING_STEPS } from '../../landing.model';

describe('LandingShowcase', () => {
  const step = LANDING_STEPS[0];
  let fixture: ComponentFixture<LandingShowcase>;

  function setup(reversed?: boolean): HTMLElement {
    TestBed.configureTestingModule({ imports: [LandingShowcase] });
    fixture = TestBed.createComponent(LandingShowcase);
    fixture.componentRef.setInput('step', step);
    if (reversed !== undefined) fixture.componentRef.setInput('reversed', reversed);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the eyebrow', () => {
    expect(setup().querySelector('.showcase__eyebrow')?.textContent?.trim()).toBe(step.eyebrow);
  });

  it('renders the title as an h3', () => {
    expect(setup().querySelector('h3')?.textContent?.trim()).toBe(step.title);
  });

  it('renders the body copy', () => {
    expect(setup().querySelector('.showcase__body')?.textContent?.trim()).toBe(step.body);
  });

  it('renders the step screenshot', () => {
    expect(setup().querySelector('img')?.getAttribute('src')).toBe(step.shot.src);
  });

  it('is not reversed by default', () => {
    expect(setup().classList.contains('reversed')).toBe(false);
  });

  it('marks the host as reversed when asked', () => {
    expect(setup(true).classList.contains('reversed')).toBe(true);
  });
});
