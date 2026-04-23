import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DiceRoller } from './dice-roller';
import { DiceRollerService } from '../../../core/services/dice-roller.service';

describe('DiceRoller', () => {
  let fixture: ComponentFixture<DiceRoller>;
  let component: DiceRoller;

  function createComponent() {
    const mockService = {
      theme: vi.fn().mockReturnValue('tavern-scroll'),
      isOpen: vi.fn().mockReturnValue(false),
      history: vi.fn().mockReturnValue([]),
      setTheme: vi.fn(),
      consumePendingRequest: vi.fn().mockReturnValue(null),
      toggle: vi.fn(),
      close: vi.fn(),
      roll: vi.fn(),
      clearHistory: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [DiceRoller],
      providers: [
        { provide: DiceRollerService, useValue: mockService },
      ],
    });

    fixture = TestBed.createComponent(DiceRoller);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('renders tavern-scroll variant', () => {
    createComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dice-variant-tavern-scroll')).toBeTruthy();
  });
});
