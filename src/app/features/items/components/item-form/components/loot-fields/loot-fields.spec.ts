import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';

import { buildItemForm } from '../../item-form.fields';
import { LootFields } from './loot-fields';

describe('LootFields', () => {
  let fixture: ComponentFixture<LootFields>;
  let form: FormGroup;

  function setup(): void {
    TestBed.configureTestingModule({ imports: [LootFields] });
    form = buildItemForm(TestBed.inject(FormBuilder));
    form.controls['kind'].setValue('loot');
    fixture = TestBed.createComponent(LootFields);
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

  it('renders the consumable toggle and the description', () => {
    setup();
    expect(labels()).toEqual(['Consumable', 'Description']);
  });

  it('renders the description as a textarea, not a single-line input', () => {
    setup();
    expect(fixture.nativeElement.querySelector('textarea#description')).not.toBeNull();
  });

  it('binds the consumable toggle to the parent group', () => {
    setup();
    form.controls['isConsumable'].setValue(true);
    fixture.detectChanges();

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('#isConsumable');
    expect(checkbox.checked).toBe(true);
  });

  it('writes description edits back into the parent group', () => {
    setup();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('#description');
    textarea.value = 'Smells faintly of brimstone.';
    textarea.dispatchEvent(new Event('input'));

    expect(form.controls['description'].value).toBe('Smells faintly of brimstone.');
  });

  it('leaves the description optional', () => {
    setup();
    expect(form.controls['description'].valid).toBe(true);
  });
});
