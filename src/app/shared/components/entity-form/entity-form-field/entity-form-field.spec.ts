import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { EntityFormField } from './entity-form-field';
import { ENTITY_FORM_LOOKUP, EntityFormLookup } from '../entity-form-lookup.token';
import { FieldDef } from '../entity-form.types';

function makeLookup(): EntityFormLookup {
  return { list: vi.fn().mockReturnValue(of([])) };
}

@Component({
  template: `<app-entity-form-field
    [field]="field()"
    [control]="control()"
    [submitted]="submitted()"
    [dependsOnControl]="dependsOnControl()"
    (createRequested)="onCreateRequested()"
  />`,
  imports: [EntityFormField, ReactiveFormsModule],
})
class HostComponent {
  readonly field = signal<FieldDef>({ name: 'x', label: 'X', kind: 'text' });
  readonly control = signal<AbstractControl>(new FormControl(''));
  readonly submitted = signal(false);
  readonly dependsOnControl = signal<FormControl<number | null> | undefined>(undefined);
  createRequestedCount = 0;
  onCreateRequested(): void {
    this.createRequestedCount++;
  }
}

async function setup(
  field: FieldDef,
  control: AbstractControl,
  submitted = false,
): Promise<{ fixture: ComponentFixture<HostComponent>; host: HostComponent; el: HTMLElement }> {
  await TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [{ provide: ENTITY_FORM_LOOKUP, useValue: makeLookup() }],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.field.set(field);
  host.control.set(control);
  host.submitted.set(submitted);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host, el };
}

describe('EntityFormField', () => {
  describe('text field', () => {
    it('renders a text input', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text' },
        new FormControl(''),
      );
      expect(el.querySelector('input[type="text"]')).toBeTruthy();
    });
  });

  describe('url field', () => {
    it('renders a url input', async () => {
      const { el } = await setup(
        { name: 'link', label: 'Link', kind: 'url' },
        new FormControl(''),
      );
      expect(el.querySelector('input[type="url"]')).toBeTruthy();
    });
  });

  describe('textarea field', () => {
    it('renders a textarea', async () => {
      const { el } = await setup(
        { name: 'desc', label: 'Description', kind: 'textarea' },
        new FormControl(''),
      );
      expect(el.querySelector('textarea')).toBeTruthy();
    });
  });

  describe('number field', () => {
    it('renders a number input', async () => {
      const { el } = await setup(
        { name: 'level', label: 'Level', kind: 'number' },
        new FormControl(null),
      );
      expect(el.querySelector('input[type="number"]')).toBeTruthy();
    });
  });

  describe('checkbox field', () => {
    it('renders a checkbox input', async () => {
      const { el } = await setup(
        { name: 'active', label: 'Active', kind: 'checkbox' },
        new FormControl(false),
      );
      expect(el.querySelector('input[type="checkbox"]')).toBeTruthy();
    });

    it('renders label text beside the checkbox', async () => {
      const { el } = await setup(
        { name: 'active', label: 'Active', kind: 'checkbox' },
        new FormControl(false),
      );
      const label = el.querySelector('.form-label--inline');
      expect(label?.textContent).toContain('Active');
    });
  });

  describe('enum field', () => {
    it('renders a select element', async () => {
      const { el } = await setup(
        {
          name: 'tier',
          label: 'Tier',
          kind: 'enum',
          options: [
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
          ],
        },
        new FormControl(''),
      );
      expect(el.querySelector('select')).toBeTruthy();
    });

    it('renders all enum options', async () => {
      const { el } = await setup(
        {
          name: 'tier',
          label: 'Tier',
          kind: 'enum',
          options: [
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
          ],
        },
        new FormControl(''),
      );
      const options = el.querySelectorAll('select option');
      expect(options.length).toBe(2);
    });
  });

  describe('entity field', () => {
    it('renders app-entity-select', async () => {
      const { el } = await setup(
        { name: 'expansion', label: 'Expansion', kind: 'entity', lookup: 'expansions' },
        new FormControl<number | null>(null),
      );
      expect(el.querySelector('app-entity-select')).toBeTruthy();
    });
  });

  describe('entityMulti field', () => {
    it('renders app-entity-multi-select', async () => {
      const { el } = await setup(
        { name: 'domains', label: 'Domains', kind: 'entityMulti', lookup: 'domains' },
        new FormControl<number[]>([]),
      );
      expect(el.querySelector('app-entity-multi-select')).toBeTruthy();
    });
  });

  describe('error display', () => {
    it('shows field-error when control is invalid and dirty', async () => {
      const ctrl = new FormControl('', Validators.required);
      ctrl.markAsDirty();
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text' },
        ctrl,
      );
      expect(el.querySelector('.field-error')).toBeTruthy();
    });

    it('does not show field-error when control is invalid but pristine and not submitted', async () => {
      const ctrl = new FormControl('', Validators.required);
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text' },
        ctrl,
      );
      expect(el.querySelector('.field-error')).toBeNull();
    });

    it('shows field-error when submitted is true and control is invalid', async () => {
      const ctrl = new FormControl('', Validators.required);
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text' },
        ctrl,
        true,
      );
      expect(el.querySelector('.field-error')).toBeTruthy();
    });

    /**
     * Every other test in this block hands over a control that is *already* invalid, so
     * `showError` saw `invalid === true` on its first evaluation. That is what hid a real bug: the
     * computed short-circuited past `submitted()` while a field was still valid, never registered
     * it as a dependency, and cached `false` forever. A field that starts valid and goes bad --
     * a damage modifier typed negative, an armor score set to zero -- showed no error at all.
     */
    it('shows the error when a field that started valid goes invalid and is submitted', async () => {
      const ctrl = new FormControl(5, Validators.min(1));
      const { fixture, host, el } = await setup(
        { name: 'score', label: 'Score', kind: 'number', min: 1 },
        ctrl,
      );
      expect(el.querySelector('.field-error')).toBeNull();

      ctrl.setValue(0);
      host.submitted.set(true);
      fixture.detectChanges();

      expect(el.querySelector('.field-error')?.textContent?.trim()).toBe('Score must be at least 1.');
    });

    it('shows the error when a field goes invalid after being touched', async () => {
      const ctrl = new FormControl(5, Validators.min(1));
      const { fixture, el } = await setup(
        { name: 'score', label: 'Score', kind: 'number', min: 1 },
        ctrl,
      );

      ctrl.setValue(0);
      ctrl.markAsTouched();
      fixture.detectChanges();

      expect(el.querySelector('.field-error')).toBeTruthy();
    });

    it('tracks a control swapped in at runtime', async () => {
      const first = new FormControl(5, Validators.min(1));
      const { fixture, host, el } = await setup(
        { name: 'score', label: 'Score', kind: 'number', min: 1 },
        first,
        true,
      );
      expect(el.querySelector('.field-error')).toBeNull();

      const second = new FormControl(0, Validators.min(1));
      host.control.set(second);
      fixture.detectChanges();

      expect(el.querySelector('.field-error')).toBeTruthy();
    });

    it('stops following the previous control once one is swapped in', async () => {
      const first = new FormControl(5, Validators.min(1));
      const { fixture, host, el } = await setup(
        { name: 'score', label: 'Score', kind: 'number', min: 1 },
        first,
        true,
      );

      const second = new FormControl(9, Validators.min(1));
      host.control.set(second);
      fixture.detectChanges();
      // The abandoned control going bad must not surface an error for the one now bound.
      first.setValue(0);
      fixture.detectChanges();

      expect(el.querySelector('.field-error')).toBeNull();
    });

    it('shows required error message over maxlength', async () => {
      const ctrl = new FormControl('', [Validators.required, Validators.maxLength(5)]);
      ctrl.markAsDirty();
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text', maxLength: 5 },
        ctrl,
      );
      const error = el.querySelector('.field-error');
      expect(error?.textContent?.trim()).toBe('Title is required.');
    });
  });

  describe('help text', () => {
    it('renders help text when provided', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text', helpText: 'Enter the card title.' },
        new FormControl(''),
      );
      expect(el.querySelector('.form-help')?.textContent?.trim()).toBe('Enter the card title.');
    });

    it('does not render help text when not provided', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text' },
        new FormControl(''),
      );
      expect(el.querySelector('.form-help')).toBeNull();
    });
  });

  describe('createRequested output', () => {
    it('forwards createRequested when entity field with allowCreate is clicked', async () => {
      const { fixture, host, el } = await setup(
        { name: 'expansion', label: 'Expansion', kind: 'entity', lookup: 'expansions', allowCreate: true },
        new FormControl<number | null>(null),
      );

      const btn = el.querySelector('button') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      btn.click();
      fixture.detectChanges();

      expect(host.createRequestedCount).toBe(1);
    });
  });

  describe('column class', () => {
    it('applies form-group--col-1 when column is 1', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text', column: 1 },
        new FormControl(''),
      );
      expect(el.querySelector('.form-group--col-1')).toBeTruthy();
    });

    it('applies form-group--col-2 when column is 2', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text', column: 2 },
        new FormControl(''),
      );
      expect(el.querySelector('.form-group--col-2')).toBeTruthy();
    });

    it('applies form-group--full when column is full', async () => {
      const { el } = await setup(
        { name: 'title', label: 'Title', kind: 'text', column: 'full' },
        new FormControl(''),
      );
      expect(el.querySelector('.form-group--full')).toBeTruthy();
    });
  });

  /**
   * Blur is the one path `statusChanges` cannot carry: marking a control touched leaves its status
   * unchanged, so a computed watching only status never re-ran and an already-invalid field the
   * user tabbed out of showed no error at all. Watching `events` covers touched and dirty too.
   */
  it('shows the error when an already-invalid field is blurred without its value changing', async () => {
    const ctrl = new FormControl('', Validators.required);
    const { fixture, el } = await setup(
      { name: 'name', label: 'Name', kind: 'text', required: true },
      ctrl,
    );
    expect(el.querySelector('.field-error')).toBeNull();

    (el.querySelector('input') as HTMLInputElement).dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(ctrl.touched).toBe(true);
    expect(el.querySelector('.field-error')?.textContent).toContain('Name is required');
  });
});
