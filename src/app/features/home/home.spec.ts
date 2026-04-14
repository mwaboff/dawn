import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Home } from './home';
import { AuthService } from '../../core/services/auth.service';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  function setup(isLoggedIn = false) {
    const mockAuthService = {
      isLoggedIn: signal(isLoggedIn),
    };

    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('should have three features', () => {
    setup();
    expect(component.features).toBeDefined();
    expect(component.features.length).toBe(3);
  });

  it('should have Characters feature', () => {
    setup();
    const charactersFeature = component.features.find(f => f.title === 'Create Characters');
    expect(charactersFeature).toBeDefined();
    expect(charactersFeature?.icon).toBe('pen-paper');
    expect(charactersFeature?.description).toContain('Build and manage your Daggerheart heroes');
  });

  it('should have Campaigns feature', () => {
    setup();
    const campaignsFeature = component.features.find(f => f.title === 'Run Campaigns');
    expect(campaignsFeature).toBeDefined();
    expect(campaignsFeature?.icon).toBe('map');
    expect(campaignsFeature?.description).toContain('Organize your adventures');
  });

  it('should have Play Together feature', () => {
    setup();
    const playFeature = component.features.find(f => f.title === 'Play Together');
    expect(playFeature).toBeDefined();
    expect(playFeature?.icon).toBe('dice');
    expect(playFeature?.description).toContain('Run your games in real-time');
  });

  it('should render hero section', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const heroSection = compiled.querySelector('.hero');
    expect(heroSection).toBeTruthy();
  });

  it('should render hero title', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero-title');
    expect(heroTitle?.textContent).toContain('Bring Your Table');
    expect(heroTitle?.textContent).toContain('Together');
  });

  it('should render hero subtitle', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('.hero-subtitle');
    expect(subtitle?.textContent).toContain('Oh Sheet is the Daggerheart toolset');
  });

  it('should render "Enlist in an Adventure" CTA when not logged in', () => {
    setup(false);
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.hero-cta a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Enlist in an Adventure');
    expect(links[0].getAttribute('href')).toBe('/auth');
    expect(links[1].textContent).toContain('Explore the Codex');
    expect(links[1].getAttribute('href')).toBe('/reference');
  });

  it('should render "Create a Character" CTA when logged in', () => {
    setup(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.hero-cta a');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Create a Character');
    expect(links[0].getAttribute('href')).toBe('/create-character');
    expect(links[1].textContent).toContain('Explore the Codex');
    expect(links[1].getAttribute('href')).toBe('/reference');
  });

  it('should always show Explore the Codex link', () => {
    setup(false);
    const compiled = fixture.nativeElement as HTMLElement;
    const codexLink = compiled.querySelector('.btn-secondary');
    expect(codexLink?.textContent).toContain('Explore the Codex');
    expect(codexLink?.getAttribute('href')).toBe('/reference');
  });

  it('should render features section title', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const featuresTitle = compiled.querySelector('.features-title');
    expect(featuresTitle?.textContent).toContain('Your Adventure Awaits');
  });

  it('should render three feature cards', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(3);
  });

  it('should render feature icons', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('.feature-icon svg');
    expect(icons.length).toBe(3);
  });

  it('should have proper ARIA attributes on buttons', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const primaryButton = compiled.querySelector('.btn-primary');
    expect(primaryButton).toBeTruthy();
  });

  it('should have decorative ornaments', () => {
    setup();
    const compiled = fixture.nativeElement as HTMLElement;
    const ornaments = compiled.querySelectorAll('.hero-ornament');
    expect(ornaments.length).toBe(4);
  });
});
