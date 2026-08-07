import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemKind } from '../../item-routes';
import { ItemKindRack } from './item-kind-rack';

describe('ItemKindRack', () => {
  let fixture: ComponentFixture<ItemKindRack>;

  function setup(kind: ItemKind = 'weapon'): void {
    TestBed.configureTestingModule({ imports: [ItemKindRack] });
    fixture = TestBed.createComponent(ItemKindRack);
    fixture.componentRef.setInput('kind', kind);
    fixture.detectChanges();
  }

  function setInput(name: string, value: unknown): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  function radios(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.kind-rack__input'));
  }

  it('offers the three kinds in catalogue order', () => {
    setup();
    expect(radios().map(r => r.value)).toEqual(['weapon', 'armor', 'loot']);
  });

  it('marks the current kind as the checked radio', () => {
    setup('armor');
    expect(radios().find(r => r.checked)?.value).toBe('armor');
  });

  it('describes what each kind asks for, so the choice can be made before making it', () => {
    setup();
    expect(fixture.nativeElement.textContent).toContain('Armor Score');
  });

  it('emits the kind that was picked', () => {
    setup();
    const emitted: ItemKind[] = [];
    fixture.componentInstance.kindChange.subscribe((k: ItemKind) => emitted.push(k));

    radios()[1].click();

    expect(emitted).toEqual(['armor']);
  });

  it('stays quiet when the already-selected kind is picked again', () => {
    setup('loot');
    const emitted: ItemKind[] = [];
    fixture.componentInstance.kindChange.subscribe((k: ItemKind) => emitted.push(k));

    fixture.componentInstance.onSelect('loot');

    expect(emitted).toEqual([]);
  });

  it('scopes the radio group to the given name, so two racks cannot share a selection', () => {
    setup();
    setInput('name', 'modal-kind');
    expect(radios().every(r => r.name === 'modal-kind')).toBe(true);
  });

  describe('locked', () => {
    it('drops the picker entirely', () => {
      setup('armor');
      setInput('locked', true);
      expect(radios()).toHaveLength(0);
    });

    it('names the kind instead, so the form still says what is being made', () => {
      setup('loot');
      setInput('locked', true);

      const chip: HTMLElement = fixture.nativeElement.querySelector('.kind-rack__chip');
      expect(chip.textContent).toContain('Loot');
    });

    it('carries the kind on the wrapper, which is what selects its accent', () => {
      setup('weapon');
      setInput('locked', true);

      const locked: HTMLElement = fixture.nativeElement.querySelector('.kind-rack__locked');
      expect(locked.getAttribute('data-kind')).toBe('weapon');
    });
  });
});
