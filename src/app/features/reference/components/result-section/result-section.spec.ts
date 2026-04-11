import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ResultSection } from './result-section';
import { MappedSearchResult } from '../../mappers/search-result.mapper';
import { SearchableEntityType } from '../../models/search.model';

function makeCardResult(id: number, name = 'Test Card'): MappedSearchResult {
  return {
    type: 'WEAPON',
    id,
    name,
    relevanceScore: 1.0,
    card: { id, name, description: 'desc', cardType: 'class' },
  };
}

function makeAdversaryResult(id: number, name = 'Test Adversary'): MappedSearchResult {
  return {
    type: 'ADVERSARY',
    id,
    name,
    relevanceScore: 0.9,
    adversary: {
      id,
      name,
      tier: 1,
      adversaryType: 'STANDARD',
    },
  };
}

@Component({
  template: `
    <app-result-section
      [type]="type"
      [results]="results"
      [totalCount]="totalCount"
      [showViewAll]="showViewAll"
      [showBadges]="showBadges"
      (viewAll)="onViewAll($event)"
    />
  `,
  imports: [ResultSection],
})
class HostComponent {
  type: SearchableEntityType = 'WEAPON';
  results: MappedSearchResult[] = [];
  totalCount = 0;
  showViewAll = false;
  showBadges = false;
  lastViewAll: SearchableEntityType | null = null;

  onViewAll(t: SearchableEntityType): void {
    this.lastViewAll = t;
  }
}

describe('ResultSection', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the section header with type label', () => {
    host.type = 'WEAPON';
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.section-title');
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('WEAPONS');
  });

  it('renders the correct number of cards', () => {
    host.results = [makeCardResult(1), makeCardResult(2), makeCardResult(3)];
    host.totalCount = 3;
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.section-card-item');
    expect(items.length).toBe(3);
  });

  it('renders adversary cards when result has adversary', () => {
    host.type = 'ADVERSARY';
    host.results = [makeAdversaryResult(1)];
    host.totalCount = 1;
    fixture.detectChanges();

    const adversaryCard = fixture.nativeElement.querySelector('app-adversary-card');
    expect(adversaryCard).toBeTruthy();
  });

  it('renders daggerheart cards when result has card', () => {
    host.type = 'WEAPON';
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('app-daggerheart-card');
    expect(card).toBeTruthy();
  });

  it('does not show view-all button when showViewAll is false', () => {
    host.results = [makeCardResult(1)];
    host.totalCount = 10;
    host.showViewAll = false;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.view-all-link');
    expect(btn).toBeNull();
  });

  it('does not show view-all button when totalCount equals results count', () => {
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    host.showViewAll = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.view-all-link');
    expect(btn).toBeNull();
  });

  it('shows view-all button when showViewAll is true and more results exist', () => {
    host.results = [makeCardResult(1), makeCardResult(2)];
    host.totalCount = 10;
    host.showViewAll = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.view-all-link');
    expect(btn).toBeTruthy();
  });

  it('emits viewAll with correct type when view-all is clicked', () => {
    host.type = 'WEAPON';
    host.results = [makeCardResult(1)];
    host.totalCount = 10;
    host.showViewAll = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.view-all-link');
    btn.click();
    expect(host.lastViewAll).toBe('WEAPON');
  });

  it('emits viewAll with adversary type', () => {
    host.type = 'ADVERSARY';
    host.results = [makeAdversaryResult(1)];
    host.totalCount = 10;
    host.showViewAll = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.view-all-link');
    btn.click();
    expect(host.lastViewAll).toBe('ADVERSARY');
  });

  it('shows wax-seal badges when showBadges is true', () => {
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    host.showBadges = true;
    fixture.detectChanges();

    const seal = fixture.nativeElement.querySelector('.wax-seal');
    expect(seal).toBeTruthy();
  });

  it('hides wax-seal badges when showBadges is false', () => {
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    host.showBadges = false;
    fixture.detectChanges();

    const seal = fixture.nativeElement.querySelector('.wax-seal');
    expect(seal).toBeNull();
  });

  it('shows match count in section header', () => {
    host.results = [makeCardResult(1), makeCardResult(2)];
    host.totalCount = 7;
    fixture.detectChanges();

    const count = fixture.nativeElement.querySelector('.section-count');
    expect(count.textContent).toContain('7');
    expect(count.textContent).toContain('matches');
  });

  it('shows singular "match" when totalCount is 1', () => {
    host.results = [makeCardResult(1)];
    host.totalCount = 1;
    fixture.detectChanges();

    const count = fixture.nativeElement.querySelector('.section-count');
    expect(count.textContent).toContain('match');
    expect(count.textContent).not.toContain('matches');
  });
});
