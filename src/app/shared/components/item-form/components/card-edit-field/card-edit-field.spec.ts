import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { CardEditField } from './card-edit-field';
import { AdminLookupService } from '../../services/admin-lookup.service';
import { FieldDef } from '../../schema/card-edit-schema.types';

function makeService() {
  return { list: vi.fn().mockReturnValue(of([])), refresh: vi.fn(), invalidate: vi.fn() };
}

@Component({
  template: `<app-card-edit-field
    [field]="field"
    [control]="control"
    [submitted]="submitted"
    [dependsOnControl]="dependsOnControl"
    (createRequested)="onCreateRequested()"
  />`,
  imports: [CardEditField, ReactiveFormsModule],
})
class HostComponent {
  field!: FieldDef;
  control!: AbstractControl;
  submitted = false;
  dependsOnControl: FormControl<number | null> | undefined = undefined;
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
    providers: [{ provide: AdminLookupService, useValue: makeService() }],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  host.field = field;
  host.control = control;
  host.submitted = submitted;
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host, el };
}

describe('CardEditField', () => {
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
});
