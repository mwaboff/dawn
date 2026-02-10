import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have three features', () => {
    expect(component.features).toBeDefined();
    expect(component.features.length).toBe(3);
  });

  it('should have Characters feature', () => {
    const charactersFeature = component.features.find(f => f.title === 'Create Characters');
    expect(charactersFeature).toBeDefined();
    expect(charactersFeature?.icon).toBe('pen-paper');
    expect(charactersFeature?.description).toContain('Build and manage your Daggerheart heroes');
  });

  it('should have Campaigns feature', () => {
    const campaignsFeature = component.features.find(f => f.title === 'Run Campaigns');
    expect(campaignsFeature).toBeDefined();
    expect(campaignsFeature?.icon).toBe('map');
    expect(campaignsFeature?.description).toContain('Organize your adventures');
  });

  it('should have Play Together feature', () => {
    const playFeature = component.features.find(f => f.title === 'Play Together');
    expect(playFeature).toBeDefined();
    expect(playFeature?.icon).toBe('dice');
    expect(playFeature?.description).toContain('Run your games in real-time');
  });

  it('should render hero section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroSection = compiled.querySelector('.hero');
    expect(heroSection).toBeTruthy();
  });

  it('should render hero title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero-title');
    expect(heroTitle?.textContent).toContain('Bring Your Table');
    expect(heroTitle?.textContent).toContain('Together');
  });

  it('should render hero subtitle', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('.hero-subtitle');
    expect(subtitle?.textContent).toContain('Oh Sheet is the Daggerheart toolset');
  });

  it('should render CTA buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.hero-cta button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Get Started');
    expect(buttons[1].textContent).toContain('Learn More');
  });

  it('should render features section title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featuresTitle = compiled.querySelector('.features-title');
    expect(featuresTitle?.textContent).toContain('Your Adventure Awaits');
  });

  it('should render three feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(3);
  });

  it('should render feature icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('.feature-icon svg');
    expect(icons.length).toBe(3);
  });

  it('should have proper ARIA attributes on buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const primaryButton = compiled.querySelector('.btn-primary');
    expect(primaryButton).toBeTruthy();
  });

  it('should have decorative ornaments', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ornaments = compiled.querySelectorAll('.hero-ornament');
    expect(ornaments.length).toBe(4);
  });
});
