import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryAddPanel } from './inventory-add-panel';

@Component({
  template: `
    <app-inventory-add-panel
      [itemType]="itemType()"
      [open]="open()" />
  `,
  imports: [InventoryAddPanel],
})
class TestHost {
  itemType = signal<'weapon' | 'armor' | 'loot'>('weapon');
  open = signal(false);
}

describe('InventoryAddPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(el.querySelector('app-inventory-add-panel')).toBeTruthy();
  });

  it('does not render panel content when closed', () => {
    host.open.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel')).toBeNull();
  });

  it('renders panel content when open', () => {
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel')).toBeTruthy();
  });

  it('shows weapon title when itemType is weapon', () => {
    host.itemType.set('weapon');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Weapon');
  });

  it('shows armor title when itemType is armor', () => {
    host.itemType.set('armor');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Armor');
  });

  it('shows loot title when itemType is loot', () => {
    host.itemType.set('loot');
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.add-panel__title')?.textContent?.trim()).toBe('Add Loot');
  });
});
