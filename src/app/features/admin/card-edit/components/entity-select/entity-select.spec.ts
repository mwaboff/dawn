import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EntitySelect } from './entity-select';
import { AdminLookupService } from '../../services/admin-lookup.service';
import { LookupOption } from '../../schema/card-edit-schema.types';

const MOCK_OPTIONS: LookupOption[] = [
  { id: 1, label: 'Option A' },
  { id: 2, label: 'Option B' },
];

@Component({
  template: `<app-entity-select
    [lookup]="lookup"
    [control]="control"
    [label]="label"
    [allowCreate]="allowCreate"
    [dependsOnControl]="dependsOnControl"
    [params]="params"
    [placeholder]="placeholder"
    (createRequested)="onCreateRequested()"
  />`,
  imports: [EntitySelect, ReactiveFormsModule],
})
class HostComponent {
  lookup = 'expansions' as const;
  control = new FormControl<number | null>(null);
  label = 'Test label';
  allowCreate = false;
  dependsOnControl: FormControl<number | null> | undefined = undefined;
  params: { classId?: number; expansionId?: number } | undefined = undefined;
  placeholder = 'Select...';
  createRequestedCount = 0;
  onCreateRequested(): void {
    this.createRequestedCount++;
  }
}

describe('EntitySelect', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;
  let mockListFn: ReturnType<typeof vi.fn>;

  async function setup(options: LookupOption[] = MOCK_OPTIONS): Promise<void> {
    mockListFn = vi.fn().mockReturnValue(of(options));
    const mockService = { list: mockListFn, refresh: vi.fn(), invalidate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AdminLookupService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  }

  describe('loading state', () => {
    it('shows Loading... option while loading is pending', async () => {
      const subject = new Subject<LookupOption[]>();
      const pendingService = { list: vi.fn().mockReturnValue(subject.asObservable()), refresh: vi.fn(), invalidate: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: AdminLookupService, useValue: pendingService }],
      }).compileComponents();

      fixture = TestBed.createComponent(HostComponent);
      el = fixture.nativeElement as HTMLElement;
      fixture.detectChanges();

      const option = el.querySelector('option[disabled]') as HTMLOptionElement;
      expect(option).toBeTruthy();
      expect(option.textContent?.trim()).toBe('Loading...');
    });
  });

  describe('options rendering', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    it('calls AdminLookupService.list on init', () => {
      expect(mockListFn).toHaveBeenCalledWith('expansions', undefined);
    });

    it('renders all options plus placeholder after load', () => {
      const options = el.querySelectorAll('select option');
      expect(options.length).toBe(MOCK_OPTIONS.length + 1);
    });

    it('renders option labels correctly', () => {
      const options = Array.from(el.querySelectorAll('select option'));
      const labels = options.map((o) => o.textContent?.trim());
      expect(labels).toContain('Option A');
      expect(labels).toContain('Option B');
    });

    it('renders placeholder as first option', () => {
      const firstOption = el.querySelector('select option') as HTMLOptionElement;
      expect(firstOption.textContent?.trim()).toBe('Select...');
    });

    it('does not show Loading... option after load completes', () => {
      const loading = el.querySelector('option[disabled]');
      expect(loading).toBeNull();
    });
  });

  describe('allowCreate', () => {
    it('does not render + New button when allowCreate is false', async () => {
      await setup();
      host.allowCreate = false;
      fixture.detectChanges();

      const btn = el.querySelector('button');
      expect(btn).toBeNull();
    });

    it('renders + New button when allowCreate is true', async () => {
      await setup();
      host.allowCreate = true;
      fixture.detectChanges();

      const btn = el.querySelector('button');
      expect(btn).toBeTruthy();
      expect(btn?.textContent?.trim()).toBe('+ New');
    });

    it('emits createRequested when + New button is clicked', async () => {
      await setup();
      host.allowCreate = true;
      fixture.detectChanges();

      const btn = el.querySelector('button') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(host.createRequestedCount).toBe(1);
    });
  });

  describe('dependsOnControl', () => {
    it('re-fetches options when dependsOnControl value changes', async () => {
      const dependsOn = new FormControl<number | null>(null);
      await setup();
      host.dependsOnControl = dependsOn;
      fixture.detectChanges();

      mockListFn.mockClear();
      dependsOn.setValue(5);
      fixture.detectChanges();

      expect(mockListFn).toHaveBeenCalled();
    });

    it('passes updated classId as part of params when dependsOn changes', async () => {
      const dependsOn = new FormControl<number | null>(null);
      await setup();
      host.dependsOnControl = dependsOn;
      fixture.detectChanges();

      mockListFn.mockClear();
      dependsOn.setValue(7);
      fixture.detectChanges();

      const calls = mockListFn.mock.calls;
      const lastParams = calls[calls.length - 1][1] as { classId?: number } | undefined;
      expect(lastParams?.classId).toBe(7);
    });

    it('clears control value when previous selection is not in new options', async () => {
      const dependsOn = new FormControl<number | null>(null);
      await setup([{ id: 1, label: 'Option A' }, { id: 2, label: 'Option B' }]);
      host.dependsOnControl = dependsOn;
      fixture.detectChanges();

      host.control.setValue(2);
      fixture.detectChanges();

      const newOptions: LookupOption[] = [{ id: 3, label: 'Option C' }];
      mockListFn.mockReturnValue(of(newOptions));

      dependsOn.setValue(10);
      fixture.detectChanges();

      expect(host.control.value).toBeNull();
    });

    it('retains control value when it is still present in new options', async () => {
      const dependsOn = new FormControl<number | null>(null);
      await setup([{ id: 1, label: 'Option A' }, { id: 2, label: 'Option B' }]);
      host.dependsOnControl = dependsOn;
      fixture.detectChanges();

      host.control.setValue(1);
      fixture.detectChanges();

      const newOptions: LookupOption[] = [{ id: 1, label: 'Option A' }, { id: 3, label: 'Option C' }];
      mockListFn.mockReturnValue(of(newOptions));

      dependsOn.setValue(10);
      fixture.detectChanges();

      expect(host.control.value).toBe(1);
    });
  });
});
