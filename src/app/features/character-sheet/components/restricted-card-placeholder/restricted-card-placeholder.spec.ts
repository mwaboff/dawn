import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RestrictedCardPlaceholder } from './restricted-card-placeholder';
import { RESTRICTED_CARD_TITLE } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';

@Component({
  imports: [RestrictedCardPlaceholder],
  template: `<app-restricted-card-placeholder><button class="test-action">Vault</button></app-restricted-card-placeholder>`,
})
class ProjectionHost {}

describe('RestrictedCardPlaceholder', () => {
  let fixture: ComponentFixture<RestrictedCardPlaceholder>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RestrictedCardPlaceholder],
    });
    fixture = TestBed.createComponent(RestrictedCardPlaceholder);
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the shared locked title', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.restricted-card-placeholder__title')?.textContent?.trim()).toBe(RESTRICTED_CARD_TITLE);
  });

  it('names the expansion in the message when provided', () => {
    fixture.componentRef.setInput('expansionName', 'Hope & Fear');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.restricted-card-placeholder__message')?.textContent).toContain('Hope & Fear');
  });

  it('degrades gracefully when the expansion is unknown', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.restricted-card-placeholder__message')?.textContent).toContain('an expansion');
    expect(el.querySelector('.restricted-card-placeholder__message')?.textContent).not.toContain('undefined');
  });

  it('projects a caller-supplied action', () => {
    const hostFixture = TestBed.createComponent(ProjectionHost);
    hostFixture.detectChanges();
    const el: HTMLElement = hostFixture.nativeElement;
    expect(el.querySelector('.test-action')?.textContent?.trim()).toBe('Vault');
  });
});
