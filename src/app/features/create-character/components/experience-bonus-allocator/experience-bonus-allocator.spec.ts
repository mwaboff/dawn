import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ExperienceBonusAllocator } from './experience-bonus-allocator';
import { Experience } from '../../models/experience.model';

@Component({
  imports: [ExperienceBonusAllocator],
  template: `
    <app-experience-bonus-allocator
      [experiences]="experiences()"
      [totalBonus]="totalBonus()"
      [initialAllocations]="initialAllocations()"
      (allocationsChanged)="onChanged($event)"
    />
  `,
})
class HostComponent {
  readonly experiences = signal<Experience[]>([
    { name: 'Sailor', modifier: 2 },
    { name: 'Scholar', modifier: 2 },
  ]);
  readonly totalBonus = signal(2);
  readonly initialAllocations = signal<number[] | undefined>(undefined);
  lastEmitted: number[] | null = null;

  onChanged(allocations: number[]): void {
    this.lastEmitted = allocations;
  }
}

describe('ExperienceBonusAllocator', () => {
  let host: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  function getAllocator(): ExperienceBonusAllocator {
    return fixture.debugElement.children[0].componentInstance as ExperienceBonusAllocator;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes allocations to zero per experience', () => {
    expect(getAllocator().allocationList()).toEqual([0, 0]);
  });

  it('reports remaining points equal to totalBonus initially', () => {
    expect(getAllocator().remaining()).toBe(2);
    expect(getAllocator().isComplete()).toBe(false);
  });

  it('increments an experience and emits new allocations', () => {
    getAllocator().onIncrement(0);
    fixture.detectChanges();
    expect(getAllocator().allocationList()).toEqual([1, 0]);
    expect(host.lastEmitted).toEqual([1, 0]);
  });

  it('caps total allocations at totalBonus', () => {
    getAllocator().onIncrement(0);
    getAllocator().onIncrement(0);
    getAllocator().onIncrement(0);
    fixture.detectChanges();
    expect(getAllocator().allocationList()).toEqual([2, 0]);
    expect(getAllocator().remaining()).toBe(0);
    expect(getAllocator().isComplete()).toBe(true);
  });

  it('does not decrement below zero', () => {
    getAllocator().onDecrement(0);
    expect(getAllocator().allocationList()).toEqual([0, 0]);
  });

  it('decrements after incrementing', () => {
    getAllocator().onIncrement(1);
    getAllocator().onDecrement(1);
    fixture.detectChanges();
    expect(getAllocator().allocationList()).toEqual([0, 0]);
  });

  it('computes effective modifier as base plus allocation', () => {
    getAllocator().onIncrement(0);
    fixture.detectChanges();
    expect(getAllocator().effectiveModifier(0)).toBe(3);
    expect(getAllocator().effectiveModifier(1)).toBe(2);
  });

  it('disables increment when no points remain', () => {
    getAllocator().onIncrement(0);
    getAllocator().onIncrement(1);
    fixture.detectChanges();
    expect(getAllocator().canIncrement()).toBe(false);
    expect(getAllocator().canDecrement(0)).toBe(true);
  });

  it('formats positive modifiers with leading +', () => {
    expect(getAllocator().formatModifier(3)).toBe('+3');
    expect(getAllocator().formatModifier(0)).toBe('+0');
    expect(getAllocator().formatModifier(-1)).toBe('-1');
  });
});
