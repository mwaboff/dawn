import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { EntityMultiSelect } from './entity-multi-select';
import { ENTITY_FORM_LOOKUP, EntityFormLookup } from '../entity-form-lookup.token';
import { LookupOption } from '../entity-form.types';

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
      [presetOptions]="presetOptions()"
    />
  `,
  imports: [EntityMultiSelect],
})
class HostComponent {
  lookup = signal<'expansions' | undefined>('expansions');
  control = signal(new FormControl<number[]>([], { nonNullable: true }));
  label = signal<string | undefined>(undefined);
  dependsOnControl = signal<FormControl<number | null> | undefined>(undefined);
  presetOptions = signal<LookupOption[] | null>(null);
}

function createMockLookup(opts: LookupOption[] = THREE_OPTIONS) {
  return {
    list: vi.fn().mockReturnValue(of(opts)),
  };
}

describe('EntityMultiSelect', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let mockLookup: ReturnType<typeof createMockLookup>;

  function setup(opts: LookupOption[] = THREE_OPTIONS) {
    mockLookup = createMockLookup(opts);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: ENTITY_FORM_LOOKUP, useValue: mockLookup },
      ],
    });

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads options from the lookup provider on init', () => {
    setup();
    expect(mockLookup.list).toHaveBeenCalledWith('expansions', undefined);
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

    mockLookup.list.mockReturnValue(of([{ id: 99, label: 'New Option' }]));
    depControl.setValue(5);
    fixture.detectChanges();

    expect(mockLookup.list).toHaveBeenCalledTimes(2);
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

    mockLookup.list.mockReturnValue(of([{ id: 1, label: 'Alpha' }]));
    depControl.setValue(5);
    fixture.detectChanges();

    expect(ctrl.value).toEqual([1]);
  });

  it('shows loading state before options arrive', () => {
    const subject = new Subject<LookupOption[]>();
    const lookup: EntityFormLookup = { list: vi.fn().mockReturnValue(subject.asObservable()) };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: ENTITY_FORM_LOOKUP, useValue: lookup }],
    });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const loadingText = fixture.nativeElement.querySelector('.loading-text');
    expect(loadingText).not.toBeNull();
    expect(loadingText.textContent.trim()).toBe('Loading...');
  });

  describe('presetOptions', () => {
    function setupPreset(options: LookupOption[] | null) {
      mockLookup = createMockLookup();
      TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: ENTITY_FORM_LOOKUP, useValue: mockLookup }],
      });
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      host.presetOptions.set(options);
      host.lookup.set(undefined);
      fixture.detectChanges();
    }

    it('renders caller-supplied options without consulting the lookup provider', () => {
      setupPreset([{ id: 7, label: 'Nightfall' }, { id: 8, label: 'Sundered Coast' }]);

      expect(mockLookup.list).not.toHaveBeenCalled();
      const labels = fixture.nativeElement.querySelectorAll('.checkbox-row span');
      expect(labels).toHaveLength(2);
      expect(labels[0].textContent.trim()).toBe('Nightfall');
    });

    it('is never in a loading state, because there is nothing to wait for', () => {
      setupPreset([{ id: 7, label: 'Nightfall' }]);
      expect(fixture.nativeElement.querySelector('.loading-text')).toBeNull();
    });

    it('renders an empty list rather than falling back to the lookup', () => {
      setupPreset([]);

      expect(mockLookup.list).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelectorAll('.checkbox-row')).toHaveLength(0);
    });

    it('toggles selection the same way fetched options do', () => {
      setupPreset([{ id: 7, label: 'Nightfall' }]);
      const ctrl = new FormControl<number[]>([], { nonNullable: true });
      host.control.set(ctrl);
      fixture.detectChanges();

      fixture.nativeElement.querySelector('input[type="checkbox"]').click();

      expect(ctrl.value).toEqual([7]);
    });

    it('does not prune selections that are absent from the supplied options', () => {
      setupPreset([{ id: 7, label: 'Nightfall' }]);
      const ctrl = new FormControl<number[]>([99], { nonNullable: true });
      host.control.set(ctrl);
      fixture.detectChanges();

      expect(ctrl.value).toEqual([99]);
    });
  });

  it('does not fetch when a lookup key is omitted', () => {
    setup();
    mockLookup.list.mockClear();
    host.lookup.set(undefined);
    fixture.detectChanges();

    expect(mockLookup.list).not.toHaveBeenCalled();
  });

  describe('no lookup provider', () => {
    it('renders without throwing, with loading false and no options', () => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
      });

      fixture = TestBed.createComponent(HostComponent);
      expect(() => fixture.detectChanges()).not.toThrow();

      const multiSelectDebugEl = fixture.debugElement.children[0];
      const instance = multiSelectDebugEl.componentInstance as EntityMultiSelect;
      expect(instance.loading()).toBe(false);
      expect(instance.options()).toEqual([]);
    });
  });
});
