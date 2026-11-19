import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingClosing } from './landing-closing';

describe('LandingClosing', () => {
  function setup(): HTMLElement {
    TestBed.configureTestingModule({ imports: [LandingClosing], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LandingClosing);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the closing heading', () => {
    expect(setup().querySelector('h2')?.textContent?.trim()).toBe('Your table is waiting');
  });

  it('renders the calls to action', () => {
    expect(setup().querySelector('app-landing-cta-links')).toBeTruthy();
  });
});
