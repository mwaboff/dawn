import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';

import { applyKindValidators, buildItemForm } from '../../item-form.fields';
import { ArmorFields } from './armor-fields';

describe('ArmorFields', () => {
  let fixture: ComponentFixture<ArmorFields>;
  let form: FormGroup;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [ArmorFields] });
    form = buildItemForm(TestBed.inject(FormBuilder));
    form.controls['kind'].setValue('armor');
    applyKindValidators(form);
    fixture = TestBed.createComponent(ArmorFields);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
  }

  function labels(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.form-label'))
      .map(el => el.textContent!.trim());
  }

  it('creates', () => {
    setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the three armor stats', () => {
    setup();
    expect(labels()).toEqual(['Base Armor Score', 'Major Threshold', 'Severe Threshold']);
  });

  it('binds controls to the parent group rather than owning any state', () => {
    setup();
    form.controls['baseScore'].setValue(9);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#baseScore');
    expect(input.value).toBe('9');
  });

  it('writes user edits back into the parent group', () => {
    setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#baseMajorThreshold');
    input.value = '8';
    input.dispatchEvent(new Event('input'));

    expect(form.controls['baseMajorThreshold'].value).toBe(8);
  });

  it('rejects an armor score below 1 once a save is attempted', () => {
    setup();
    form.controls['baseScore'].setValue(0);
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Base Armor Score must be at least 1.');
  });

  it('rejects a non-positive major threshold once a save is attempted', () => {
    setup();
    form.controls['baseMajorThreshold'].setValue(0);
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Major Threshold must be greater than 0.');
  });

  it('rejects a non-positive severe threshold once a save is attempted', () => {
    setup();
    form.controls['baseSevereThreshold'].setValue(-2);
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Severe Threshold must be greater than 0.');
  });

  it('accepts an unusually high armor score, which is only advisory', () => {
    setup();
    form.controls['baseScore'].setValue(40);

    expect(form.controls['baseScore'].valid).toBe(true);
  });
});
