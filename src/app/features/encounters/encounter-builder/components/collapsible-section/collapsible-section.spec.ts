import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { CollapsibleSection } from './collapsible-section';

@Component({
  imports: [CollapsibleSection],
  template: `
    <app-collapsible-section [title]="title()" [sectionId]="sectionId()" [collapsed]="collapsed()" (toggled)="toggled.set(toggled() + 1)">
      <span section-badge>{{ badge() }}</span>
      <p class="body-content">Body content</p>
    </app-collapsible-section>
  `,
})
class TestHost {
  title = signal('Roster');
  sectionId = signal('roster');
  collapsed = signal(false);
  badge = signal('3 in roster');
  toggled = signal(0);
}

describe('CollapsibleSection', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title', () => {
    const name = fixture.nativeElement.querySelector('.expandable-card__name');
    expect(name.textContent.trim()).toBe('Roster');
  });

  it('projects the badge content', () => {
    const badge = fixture.nativeElement.querySelector('[section-badge]');
    expect(badge.textContent.trim()).toBe('3 in roster');
  });

  it('renders projected body content and aria-expanded=true when not collapsed', () => {
    const toggle = fixture.nativeElement.querySelector('.expandable-card__header');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.body-content')).toBeTruthy();
  });

  it('hides the body and sets aria-expanded=false when collapsed', () => {
    host.collapsed.set(true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.expandable-card__header');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.body-content')).toBeFalsy();
  });

  it('builds aria-controls/body id from sectionId', () => {
    const toggle = fixture.nativeElement.querySelector('.expandable-card__header');
    expect(toggle.getAttribute('aria-controls')).toBe('builder-roster-body');
    expect(fixture.nativeElement.querySelector('#builder-roster-body')).toBeTruthy();
  });

  it('emits toggled when the header button is clicked', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.expandable-card__header');
    toggle.click();

    expect(host.toggled()).toBe(1);
  });

  it('uses a real button as the toggle, not a clickable div', () => {
    const toggle = fixture.nativeElement.querySelector('.expandable-card__header');
    expect(toggle.tagName).toBe('BUTTON');
  });
});
