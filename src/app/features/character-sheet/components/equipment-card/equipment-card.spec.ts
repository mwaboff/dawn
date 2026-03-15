import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentCard, EquipmentStat } from './equipment-card';
import { FeatureDisplay } from '../../models/character-sheet-view.model';

@Component({
  template: `<app-equipment-card [name]="name()" [badge]="badge()" [stats]="stats()" [features]="features()" />`,
  imports: [EquipmentCard],
})
class TestHost {
  name = signal('Longsword');
  badge = signal<string | undefined>('Primary');
  stats = signal<EquipmentStat[]>([
    { label: 'damage', value: '1d8+2' },
    { label: 'range', value: 'Melee' },
  ]);
  features = signal<FeatureDisplay[]>([]);
}

describe('EquipmentCard', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-equipment-card')).toBeTruthy();
  });

  it('displays the equipment name', () => {
    expect(el.querySelector('.equipment-card__name')?.textContent?.trim()).toBe('Longsword');
  });

  it('displays the badge when provided', () => {
    expect(el.querySelector('.equipment-card__badge')?.textContent?.trim()).toBe('Primary');
  });

  it('hides the badge when not provided', () => {
    host.badge.set(undefined);
    fixture.detectChanges();

    expect(el.querySelector('.equipment-card__badge')).toBeFalsy();
  });

  it('renders stats', () => {
    expect(el.querySelectorAll('.equip-stat').length).toBe(2);
  });

  it('displays stat values', () => {
    const stats = el.querySelectorAll('.equip-stat');
    expect(stats[0].textContent?.trim()).toBe('1d8+2');
    expect(stats[1].textContent?.trim()).toBe('Melee');
  });

  it('renders features when provided', () => {
    host.features.set([
      { name: 'Cleave', description: 'Hit all adjacent enemies', tags: ['Action'] },
    ]);
    fixture.detectChanges();

    expect(el.querySelector('.feature-row__name')?.textContent?.trim()).toBe('Cleave');
  });

  it('renders feature tags', () => {
    host.features.set([
      { name: 'Cleave', description: 'Hit all adjacent enemies', tags: ['Action', 'Melee'] },
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.feature-tag').length).toBe(2);
  });

  it('hides features section when empty', () => {
    expect(el.querySelector('.equipment-card__features')).toBeFalsy();
  });
});
