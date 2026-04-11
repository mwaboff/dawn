import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { EntityMultiSelect } from './entity-multi-select';
import { AdminLookupService } from '../../services/admin-lookup.service';
import { LookupOption } from '../../schema/card-edit-schema.types';

const THREE_OPTIONS: LookupOption[] = [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Beta' },
  { id: 3, label: 'Gamma' },
];

const TEN_OPTIONS: LookupOption[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  label: `Option ${i + 1}`,
}));

@Component({
  template: `
    <app-entity-multi-select
      [lookup]="lookup()"
      [control]="control()"
      [label]="label()"
      [dependsOnControl]="dependsOnControl()"
    />
  `,
  imports: [EntityMultiSelect],
})
class HostComponent {
  lookup = signal<'expansions'>('expansions');
  control = signal(new FormControl<number[]>([], { nonNullable: true }));
  label = signal<string | undefined>(undefined);
  dependsOnControl = signal<FormControl<number | null> | undefined>(undefined);
}

function createMockLookupService(opts: LookupOption[] = THREE_OPTIONS) {
  return {
    list: vi.fn().mockReturnValue(of(opts)),
  };
}

describe('EntityMultiSelect', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let mockLookupService: ReturnType<typeof createMockLookupService>;

  function setup(opts: LookupOption[] = THREE_OPTIONS) {
    mockLookupService = createMockLookupService(opts);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: AdminLookupService, useValue: mockLookupService },
      ],
    });

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads options from AdminLookupService on init', () => {
    setup();
    expect(mockLookupService.list).toHaveBeenCalledWith('expansions', undefined);
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);
  });

  it('renders a checkbox for each option', () => {
    setup();
    const labels = fixture.nativeElement.querySelectorAll('.checkbox-row span');
    expect(labels[0].textContent.trim()).toBe('Alpha');
    expect(labels[1].textContent.trim()).toBe('Beta');
    expect(labels[2].textContent.trim()).toBe('Gamma');
  });

  it('renders label when provided', () => {
    setup();
    host.label.set('My Label');
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h4.form-label');
    expect(heading).not.toBeNull();
    expect(heading.textContent.trim()).toBe('My Label');
  });

  it('does not render label element when label is not provided', () => {
    setup();
    const heading = fixture.nativeElement.querySelector('h4.form-label');
    expect(heading).toBeNull();
  });

  it('reflects initial selected values as checked', () => {
    setup();
    const ctrl = new FormControl<number[]>([1, 3], { nonNullable: true });
    host.control.set(ctrl);
    fixture.detectChanges();

    const checkboxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]'
    );
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(true);
  });

  it('toggling an unchecked checkbox adds id to control value and marks dirty', () => {
    setup();
    const ctrl = new FormControl<number[]>([], { nonNullable: true });
    host.control.set(ctrl);
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]'
    )[0];
    checkbox.click();
    fixture.detectChanges();

    expect(ctrl.value).toContain(1);
    expect(ctrl.dirty).toBe(true);
  });

  it('toggling a checked checkbox removes id from control value and marks dirty', () => {
    setup();
    const ctrl = new FormControl<number[]>([2], { nonNullable: true });
    host.control.set(ctrl);
    fixture.detectChanges();

    const checkboxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes[1].click();
    fixture.detectChanges();

    expect(ctrl.value).not.toContain(2);
    expect(ctrl.dirty).toBe(true);
  });

  it('does not apply scrollable class when list has 8 or fewer options', () => {
    const eightOptions = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, label: `Opt ${i + 1}` }));
    setup(eightOptions);
    const list = fixture.nativeElement.querySelector('.checkbox-list');
    expect(list.classList.contains('checkbox-list--scrollable')).toBe(false);
  });

  it('applies scrollable class when list has more than 8 options', () => {
    setup(TEN_OPTIONS);
    const list = fixture.nativeElement.querySelector('.checkbox-list');
    expect(list.classList.contains('checkbox-list--scrollable')).toBe(true);
  });

  it('re-fetches options when dependsOnControl emits a new value', () => {
    setup();
    const depControl = new FormControl<number | null>(null);
    host.dependsOnControl.set(depControl);
    fixture.detectChanges();

    mockLookupService.list.mockReturnValue(of([{ id: 99, label: 'New Option' }]));
    depControl.setValue(5);
    fixture.detectChanges();

    expect(mockLookupService.list).toHaveBeenCalledTimes(2);
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(1);
  });

  it('prunes stale selected ids after dependsOnControl re-fetch', () => {
    setup();
    const depControl = new FormControl<number | null>(null);
    host.dependsOnControl.set(depControl);
    const ctrl = new FormControl<number[]>([1, 2, 3], { nonNullable: true });
    host.control.set(ctrl);
    fixture.detectChanges();

    mockLookupService.list.mockReturnValue(of([{ id: 1, label: 'Alpha' }]));
    depControl.setValue(5);
    fixture.detectChanges();

    expect(ctrl.value).toEqual([1]);
  });

  it('shows loading state before options arrive', () => {
    const subject = new Subject<LookupOption[]>();
    const service = { list: vi.fn().mockReturnValue(subject.asObservable()) };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AdminLookupService, useValue: service }],
    });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const loadingText = fixture.nativeElement.querySelector('.loading-text');
    expect(loadingText).not.toBeNull();
    expect(loadingText.textContent.trim()).toBe('Loading...');
  });
});
