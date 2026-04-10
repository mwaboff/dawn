import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CodexSkeleton, CodexSkeletonVariant } from './codex-skeleton';

@Component({
  imports: [CodexSkeleton],
  template: `<app-codex-skeleton [variant]="variant()" [count]="count()" />`,
})
class TestHost {
  variant = signal<CodexSkeletonVariant>('mixed');
  count = signal<number | null>(null);
}

describe('CodexSkeleton', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.nativeElement.querySelector('app-codex-skeleton')).toBeTruthy();
  });

  it('renders 3 skeleton cards for mixed variant by default', () => {
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(3);
  });

  it('renders 6 skeleton cards for focused variant', () => {
    host.variant.set('focused');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(6);
  });

  it('renders explicit count when count input is provided, overriding variant', () => {
    host.variant.set('mixed');
    host.count.set(4);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(4);
  });

  it('uses variant count when count input is null', () => {
    host.variant.set('focused');
    host.count.set(null);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(6);
  });
});
