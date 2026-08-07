import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CollapsibleCardGroup } from './collapsible-card-group';

@Component({
  imports: [CollapsibleCardGroup],
  template: `
    <app-collapsible-card-group
      [heading]="heading()"
      accent="domain"
      sectionId="vault"
      [count]="count()"
      [collapsedByDefault]="collapsedByDefault()"
    >
      <span group-header-extra class="spinner-stub">Saving</span>
      <p class="projected-body">Body content</p>
    </app-collapsible-card-group>
  `,
})
class HostComponent {
  readonly heading = signal('Domain Card Vault');
  readonly count = signal<string | number | undefined>('3');
  readonly collapsedByDefault = signal(false);
}

describe('CollapsibleCardGroup', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function create(configure?: (host: HostComponent) => void): HTMLElement {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    configure?.(host);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function toggleButton(el: HTMLElement): HTMLButtonElement {
    return el.querySelector('.card-group__toggle') as HTMLButtonElement;
  }

  it('renders the heading inside a real button within the h3', () => {
    const el = create();

    expect(el.querySelector('h3.card-group__heading > button.card-group__toggle')?.textContent).toContain(
      'Domain Card Vault',
    );
  });

  it('projects body content while expanded', () => {
    const el = create();

    expect(el.querySelector('.projected-body')?.textContent).toBe('Body content');
  });

  it('projects header extras into the heading row', () => {
    const el = create();

    expect(el.querySelector('.card-group__heading-row .spinner-stub')).toBeTruthy();
  });

  it('applies the accent modifier to the heading row', () => {
    const el = create();

    expect(el.querySelector('.card-group__heading-row')?.classList).toContain('card-group__heading-row--domain');
  });

  it('points aria-controls at the body it toggles, keeping the slug in the id', () => {
    const el = create();
    const body = el.querySelector('.card-group__body') as HTMLElement;

    expect(body.id).toContain('vault');
    expect(toggleButton(el).getAttribute('aria-controls')).toBe(body.id);
  });

  it('keeps the aria-controls target in the DOM while collapsed, so the reference never dangles', () => {
    const el = create(component => component.collapsedByDefault.set(true));
    const target = toggleButton(el).getAttribute('aria-controls')!;

    expect(el.querySelector(`#${target}`)).toBeTruthy();
  });

  it('gives two instances on one page distinct body ids', () => {
    const el = create();
    const second = TestBed.createComponent(HostComponent);
    second.detectChanges();

    const firstId = (el.querySelector('.card-group__body') as HTMLElement).id;
    const secondId = (second.nativeElement as HTMLElement).querySelector<HTMLElement>('.card-group__body')!.id;
    expect(firstId).not.toBe(secondId);
  });

  it('reports aria-expanded true while the group is open', () => {
    const el = create();

    expect(toggleButton(el).getAttribute('aria-expanded')).toBe('true');
  });

  it('hides the body and flips aria-expanded when the header is clicked', () => {
    const el = create();

    toggleButton(el).click();
    fixture.detectChanges();

    expect(el.querySelector('.projected-body')).toBeNull();
    expect(toggleButton(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('re-renders the body on a second click', () => {
    const el = create();

    toggleButton(el).click();
    fixture.detectChanges();
    toggleButton(el).click();
    fixture.detectChanges();

    expect(el.querySelector('.projected-body')).toBeTruthy();
  });

  it('starts collapsed when collapsedByDefault is set', () => {
    const el = create(component => component.collapsedByDefault.set(true));

    expect(el.querySelector('.projected-body')).toBeNull();
    expect(toggleButton(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the count chip visible while collapsed', () => {
    const el = create(component => component.collapsedByDefault.set(true));

    expect(el.querySelector('.card-group__count')?.textContent?.trim()).toBe('3');
  });

  it('still renders the count chip for a count of zero', () => {
    const el = create(component => component.count.set(0));

    expect(el.querySelector('.card-group__count')?.textContent?.trim()).toBe('0');
  });

  it('omits the count chip when no count is given', () => {
    const el = create(component => component.count.set(undefined));

    expect(el.querySelector('.card-group__count')).toBeNull();
  });

  it('marks the chevron open only while expanded', () => {
    const el = create();
    const chevron = el.querySelector('.card-group__chevron') as HTMLElement;
    expect(chevron.classList).toContain('card-group__chevron--open');

    toggleButton(el).click();
    fixture.detectChanges();

    expect(chevron.classList).not.toContain('card-group__chevron--open');
  });

  it('carries the card-group class on its host so the sheet spacing still applies', () => {
    const el = create();

    expect(el.querySelector('app-collapsible-card-group')?.classList).toContain('card-group');
  });
});
