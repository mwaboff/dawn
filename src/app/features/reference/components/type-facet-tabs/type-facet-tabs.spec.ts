import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { TypeFacetTabs } from './type-facet-tabs';
import { SearchableEntityType } from '../../models/search.model';

@Component({
  template: `
    <app-type-facet-tabs
      [activeType]="activeType()"
      (typeChange)="onTypeChange($event)"
    />
  `,
  imports: [TypeFacetTabs],
})
class TestHost {
  activeType = signal<SearchableEntityType | null>(null);
  lastType: SearchableEntityType | null | undefined = undefined;
  onTypeChange(t: SearchableEntityType | null): void { this.lastType = t; }
}

describe('TypeFacetTabs', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(fixture.nativeElement.querySelector('app-type-facet-tabs')).toBeTruthy();
  });

  it('renders a tablist', () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
  });

  it('renders 12 tabs (All + 11 types)', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(12);
  });

  it('marks All tab as active when activeType is null', () => {
    const allTab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLElement;
    expect(allTab.getAttribute('aria-selected')).toBe('true');
  });

  it('marks correct tab as active when activeType is set', () => {
    host.activeType.set('WEAPON');
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
    const weaponTab = Array.from(tabs).find(t => t.textContent?.includes('Weapons'));
    expect(weaponTab?.getAttribute('aria-selected')).toBe('true');
  });

  it('emits null when All tab is clicked', () => {
    const allTab = fixture.nativeElement.querySelector('[role="tab"]') as HTMLButtonElement;
    allTab.click();
    expect(host.lastType).toBeNull();
  });

  it('emits the correct type when a type tab is clicked', () => {
    host.activeType.set(null);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    const weaponTab = Array.from(tabs).find(t => t.textContent?.includes('Weapons'));
    weaponTab?.click();
    expect(host.lastType).toBe('WEAPON');
  });

  it('navigates to next tab on ArrowRight', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    const firstTab = tabs[0];

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    firstTab.dispatchEvent(event);
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[1]);
  });

  it('wraps around to last tab on ArrowLeft from first tab', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[0].focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    tabs[0].dispatchEvent(event);
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[tabs.length - 1]);
  });

  it('focuses first tab on Home key', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[5].focus();
    const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
    tabs[5].dispatchEvent(event);
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[0]);
  });

  it('focuses last tab on End key', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[0].focus();
    const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    tabs[0].dispatchEvent(event);
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[tabs.length - 1]);
  });

  it('emits typeChange on Enter key', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    const weaponIndex = Array.from(tabs).findIndex(t => t.textContent?.includes('Weapons'));
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    tabs[weaponIndex].dispatchEvent(event);
    expect(host.lastType).toBe('WEAPON');
  });

  it('emits typeChange on Space key', () => {
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    const armorIndex = Array.from(tabs).findIndex(t => t.textContent?.includes('Armor'));
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    tabs[armorIndex].dispatchEvent(event);
    expect(host.lastType).toBe('ARMOR');
  });
});
