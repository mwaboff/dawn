import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CodexEmptyState, CodexEmptyVariant } from './codex-empty-state';
import { SearchableEntityType } from '../../models/search.model';

@Component({
  imports: [CodexEmptyState],
  template: `
    <app-codex-empty-state
      [variant]="variant()"
      [query]="query()"
      [type]="type()"
      [hasActiveFilters]="hasActiveFilters()"
      (clearFilters)="onClear()"
    />
  `,
})
class TestHost {
  variant = signal<CodexEmptyVariant>('search');
  query = signal('');
  type = signal<SearchableEntityType | null>(null);
  hasActiveFilters = signal(false);
  onClear = vi.fn();
}

describe('CodexEmptyState', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.nativeElement.querySelector('app-codex-empty-state')).toBeTruthy();
  });

  describe('search variant', () => {
    it('renders the query in the message', () => {
      host.query.set('flame sword');
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.codex-empty__message') as HTMLElement;
      expect(msg.textContent).toContain('flame sword');
    });

    it('renders the silent archives message', () => {
      host.query.set('xyzzy');
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.codex-empty__message') as HTMLElement;
      expect(msg.textContent).toContain('The archives fall silent');
      expect(msg.textContent).toContain('"xyzzy"');
    });

    it('does not show clear-filters button when hasActiveFilters is false', () => {
      host.hasActiveFilters.set(false);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.codex-empty__clear-btn');
      expect(btn).toBeNull();
    });

    it('shows clear-filters button when hasActiveFilters is true', () => {
      host.hasActiveFilters.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.codex-empty__clear-btn');
      expect(btn).toBeTruthy();
    });

    it('emits clearFilters when clear button clicked', () => {
      host.hasActiveFilters.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.codex-empty__clear-btn') as HTMLButtonElement;
      btn.click();
      expect(host.onClear).toHaveBeenCalledOnce();
    });
  });

  describe('browse variant', () => {
    beforeEach(() => {
      host.variant.set('browse');
      fixture.detectChanges();
    });

    it('renders the type label in the message for WEAPON', () => {
      host.type.set('WEAPON');
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.codex-empty__message') as HTMLElement;
      expect(msg.textContent).toContain('weapons');
    });

    it('renders the type label in the message for ADVERSARY', () => {
      host.type.set('ADVERSARY');
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.codex-empty__message') as HTMLElement;
      expect(msg.textContent).toContain('adversaries');
    });

    it('renders fallback "results" when type is null', () => {
      host.type.set(null);
      fixture.detectChanges();
      const msg = fixture.nativeElement.querySelector('.codex-empty__message') as HTMLElement;
      expect(msg.textContent).toContain('results');
    });

    it('shows clear-filters button when hasActiveFilters is true', () => {
      host.hasActiveFilters.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.codex-empty__clear-btn');
      expect(btn).toBeTruthy();
    });

    it('emits clearFilters when clear button clicked in browse variant', () => {
      host.hasActiveFilters.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.codex-empty__clear-btn') as HTMLButtonElement;
      btn.click();
      expect(host.onClear).toHaveBeenCalledOnce();
    });
  });
});
