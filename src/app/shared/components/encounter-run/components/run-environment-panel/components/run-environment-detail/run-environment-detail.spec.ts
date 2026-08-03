import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { RunEnvironmentDetail } from './run-environment-detail';
import { CardData } from '../../../../../daggerheart-card/daggerheart-card.model';

function buildCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: 7,
    name: 'Sundered Ruins',
    description: 'A crumbling stone ruin.',
    cardType: 'environment',
    subtitle: 'Exploration',
    subtitleSecondary: 'Tier 1',
    ...overrides,
  };
}

@Component({
  imports: [RunEnvironmentDetail],
  template: `
    <app-run-environment-detail [card]="card()" [impulses]="impulses()" [potentialAdversaries]="potentialAdversaries()" />
  `,
})
class TestHost {
  card = signal<CardData>(buildCard());
  impulses = signal<string | undefined>(undefined);
  potentialAdversaries = signal<string | undefined>(undefined);
}

describe('RunEnvironmentDetail', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not render type/tier here -- they moved inline onto the row itself', () => {
    expect(fixture.nativeElement.querySelector('.run-detail__meta')).toBeFalsy();
  });

  it('should render the description', () => {
    expect(fixture.nativeElement.querySelector('.run-detail__description').textContent.trim()).toBe(
      'A crumbling stone ruin.',
    );
  });

  it('should render Impulses when set', () => {
    host.impulses.set('Trap the party, collapse the ceiling');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impulses');
    expect(fixture.nativeElement.textContent).toContain('Trap the party');
  });

  it('should not render an Impulses section when absent', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Impulses');
  });

  it('should render Potential Adversaries when set', () => {
    host.potentialAdversaries.set('Skeletons, a Cave Troll');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Potential Adversaries');
    expect(fixture.nativeElement.textContent).toContain('Skeletons');
  });

  it('should render Features with their timing subtitle', () => {
    host.card.set(
      buildCard({ features: [{ name: 'Overwhelming Assault', description: 'The siege presses forward.', subtitle: 'Action' }] }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-card-feature-item')).toBeTruthy();
  });

  it('should not render a Features section when there are none', () => {
    expect(fixture.nativeElement.querySelector('app-card-feature-item')).toBeFalsy();
  });
});
