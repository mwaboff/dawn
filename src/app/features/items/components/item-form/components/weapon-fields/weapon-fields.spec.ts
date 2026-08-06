import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';

import { buildItemForm } from '../../item-form.fields';
import { DICE_COUNT_NOTE } from '../../../../utils/item-balance.utils';
import { WeaponFields } from './weapon-fields';

describe('WeaponFields', () => {
  let fixture: ComponentFixture<WeaponFields>;
  let form: FormGroup;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [WeaponFields] });
    form = buildItemForm(TestBed.inject(FormBuilder));
    fixture = TestBed.createComponent(WeaponFields);
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

  it('renders every weapon field', () => {
    setup();
    expect(labels()).toEqual([
      'Primary weapon',
      'Trait',
      'Range',
      'Burden',
      'Damage Die',
      'Damage Modifier',
      'Damage Type',
    ]);
  });

  it('never offers a dice count field, because Proficiency supplies it', () => {
    setup();
    expect(labels().some(label => /dice count/i.test(label))).toBe(false);
    expect(fixture.nativeElement.querySelector('#diceCount')).toBeNull();
  });

  it('explains where the dice count comes from instead', () => {
    setup();
    const help = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.form-help'))
      .map(el => el.textContent!.trim());
    expect(help).toContain(DICE_COUNT_NOTE);
  });

  it('omits OUT_OF_RANGE from the range picker', () => {
    setup();
    const options = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#range option'),
    ).map(o => o.value);

    expect(options).toEqual(['MELEE', 'VERY_CLOSE', 'CLOSE', 'FAR', 'VERY_FAR']);
  });

  it('offers all six traits', () => {
    setup();
    expect(fixture.nativeElement.querySelectorAll('#trait option')).toHaveLength(6);
  });

  it('offers every die including the rare d20', () => {
    setup();
    const options = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#diceType option'),
    ).map(o => o.value);

    expect(options).toEqual(['D4', 'D6', 'D8', 'D10', 'D12', 'D20']);
  });

  it('binds controls to the parent group rather than owning any state', () => {
    setup();
    form.controls['trait'].setValue('KNOWLEDGE');
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#trait');
    expect(select.value).toBe('KNOWLEDGE');
  });

  it('writes user edits back into the parent group', () => {
    setup();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#modifier');
    input.value = '7';
    input.dispatchEvent(new Event('input'));

    expect(form.controls['modifier'].value).toBe(7);
  });

  it('shows the modifier error once a save has been attempted', () => {
    setup();
    form.controls['modifier'].setValue(-1);
    fixture.componentRef.setInput('submitted', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Damage Modifier must be at least 0.');
  });

  it('stays quiet about errors before a save is attempted', () => {
    setup();
    form.controls['modifier'].setValue(-1);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.field-error')).toBeNull();
  });
});
