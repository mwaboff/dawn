import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlsoHappeningBanner } from './also-happening-banner';

describe('AlsoHappeningBanner', () => {
  let fixture: ComponentFixture<AlsoHappeningBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlsoHappeningBanner] }).compileComponents();
    fixture = TestBed.createComponent(AlsoHappeningBanner);
  });

  it('renders nothing when there are no items', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.also-happening-banner')).toBeNull();
  });

  it('lists every item when present', () => {
    fixture.componentRef.setInput('items', ['Companion Training: 1 option for Rufus', 'Rufus gains an Experience (+2)']);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.also-happening-banner__list li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Companion Training: 1 option for Rufus');
    expect(items[1].textContent).toContain('Rufus gains an Experience (+2)');
  });
});
