import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SavingSpinner } from './saving-spinner';

describe('SavingSpinner', () => {
  let fixture: ComponentFixture<SavingSpinner>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SavingSpinner],
    });
    fixture = TestBed.createComponent(SavingSpinner);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the spinner element', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.saving-spinner')).toBeTruthy();
  });

  it('renders saving label text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.saving-label')?.textContent?.trim()).toBe('saving');
  });

  it('has role status for accessibility', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('status');
  });
});
