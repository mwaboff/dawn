import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionsSummary } from './selections-summary';

describe('SelectionsSummary', () => {
  let component: SelectionsSummary;
  let fixture: ComponentFixture<SelectionsSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionsSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionsSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasSelections', () => {
    it('should return false when no selections provided', () => {
      expect(component.hasSelections()).toBe(false);
    });

    it('should return true when class is selected', () => {
      fixture.componentRef.setInput('selections', { class: 'Warrior' });
      fixture.detectChanges();
      expect(component.hasSelections()).toBe(true);
    });

    it('should return true when any single field is selected', () => {
      fixture.componentRef.setInput('selections', { ancestry: 'Elf' });
      fixture.detectChanges();
      expect(component.hasSelections()).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should not render selections summary when no selections exist', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const summary = compiled.querySelector('.selections-summary');
      expect(summary).toBeNull();
    });

    it('should render class selection tag when class is selected', () => {
      fixture.componentRef.setInput('selections', { class: 'Warrior' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const summary = compiled.querySelector('.selections-summary');
      expect(summary).toBeTruthy();

      const tags = compiled.querySelectorAll('.selection-tag');
      expect(tags).toHaveLength(1);

      const label = tags[0].querySelector('.selection-label');
      const value = tags[0].querySelector('.selection-value');
      expect(label?.textContent?.trim()).toBe('Class');
      expect(value?.textContent?.trim()).toBe('Warrior');
    });

    it('should render multiple selection tags when multiple selections exist', () => {
      fixture.componentRef.setInput('selections', {
        class: 'Guardian',
        subclass: 'Stalwart',
        domains: 'Blade · Valor',
        ancestry: 'Elf',
        community: 'Highborne',
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('.selection-tag');
      expect(tags).toHaveLength(5);
    });

    it('should render domains selection tag when domains are provided', () => {
      fixture.componentRef.setInput('selections', { subclass: 'Stalwart', domains: 'Blade · Valor' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('.selection-tag');
      const labels = Array.from(tags).map(
        (tag) => tag.querySelector('.selection-label')?.textContent?.trim(),
      );
      const values = Array.from(tags).map(
        (tag) => tag.querySelector('.selection-value')?.textContent?.trim(),
      );

      expect(labels).toContain('Domains');
      expect(values).toContain('Blade · Valor');
    });

    it('should display correct values for each selection type', () => {
      fixture.componentRef.setInput('selections', {
        class: 'Ranger',
        ancestry: 'Dwarf',
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('.selection-tag');
      expect(tags).toHaveLength(2);

      const labels = Array.from(tags).map(
        (tag) => tag.querySelector('.selection-label')?.textContent?.trim(),
      );
      const values = Array.from(tags).map(
        (tag) => tag.querySelector('.selection-value')?.textContent?.trim(),
      );

      expect(labels).toEqual(['Class', 'Ancestry']);
      expect(values).toEqual(['Ranger', 'Dwarf']);
    });

    it('should hide selections summary when selections are cleared', () => {
      fixture.componentRef.setInput('selections', { class: 'Warrior' });
      fixture.detectChanges();

      let summary = fixture.nativeElement.querySelector('.selections-summary');
      expect(summary).toBeTruthy();

      fixture.componentRef.setInput('selections', {});
      fixture.detectChanges();

      summary = fixture.nativeElement.querySelector('.selections-summary');
      expect(summary).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role="list" on selections summary', () => {
      fixture.componentRef.setInput('selections', { class: 'Wizard' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const summary = compiled.querySelector('.selections-summary');
      expect(summary?.getAttribute('role')).toBe('list');
      expect(summary?.getAttribute('aria-label')).toBe('Character selections');
    });

    it('should have role="listitem" on each selection tag', () => {
      fixture.componentRef.setInput('selections', { class: 'Sorcerer', subclass: 'Pyromancer', domains: 'Arcana · Midnight' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('.selection-tag');
      expect(tags).toHaveLength(3);
      tags.forEach((tag) => {
        expect(tag.getAttribute('role')).toBe('listitem');
      });
    });
  });
});
