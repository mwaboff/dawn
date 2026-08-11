import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { RollOptionsDirective, RollOption } from './roll-options.directive';

@Component({
  template: `
    <button appRollOptions (rollOptionSelected)="record($event)">Roll Agility</button>
    <input id="outside-input" />
  `,
  imports: [RollOptionsDirective],
})
class TestHost {
  readonly selections: RollOption[] = [];

  record(option: RollOption): void {
    this.selections.push(option);
  }
}

function pointerEvent(type: string, init: Partial<PointerEventInit> = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 0,
    clientY: 0,
    ...init,
  });
}

function contextMenuEvent(init: Partial<MouseEventInit> = {}): MouseEvent {
  return new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 5, ...init });
}

describe('RollOptionsDirective', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let button: HTMLButtonElement;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  function menuItems(): HTMLButtonElement[] {
    return Array.from(
      overlayContainer
        .getContainerElement()
        .querySelectorAll<HTMLButtonElement>('.roll-options-menu__item'),
    );
  }

  function menuPanel(): HTMLElement | null {
    return overlayContainer.getContainerElement().querySelector<HTMLElement>('.roll-options-menu');
  }

  it('creates the host and does not render the menu until triggered', () => {
    expect(button).toBeTruthy();
    expect(menuItems().length).toBe(0);
  });

  it('opens the Advantage/Normal/Disadvantage menu on contextmenu', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();

    const labels = menuItems().map((el) => el.textContent?.trim());
    expect(labels).toEqual([expect.stringContaining('Advantage'), expect.stringContaining('Normal'), expect.stringContaining('Disadvantage')]);
  });

  it('opens the menu after a ~500ms long-press', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));
    expect(menuItems().length).toBe(0);

    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('does not open the menu on a short press (pointerup before 500ms)', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(200);
    button.dispatchEvent(pointerEvent('pointerup'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('cancels the long-press when the pointer moves past the threshold (page scroll)', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    button.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 40 }));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('does not cancel the long-press for pointer movement under the threshold', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    button.dispatchEvent(pointerEvent('pointermove', { clientX: 2, clientY: 2 }));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('cancels the long-press on pointercancel', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));
    button.dispatchEvent(pointerEvent('pointercancel'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('ignores a right mouse button pointerdown (native contextmenu handles it instead)', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown', { button: 2 }));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('suppresses the click synthesized after a long-press release', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(500);
    button.dispatchEvent(pointerEvent('pointerup'));

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const notPrevented = button.dispatchEvent(click);

    expect(notPrevented).toBe(false); // dispatchEvent returns false when preventDefault() was called
  });

  it('does not suppress an ordinary click that was not preceded by a long-press', () => {
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const notPrevented = button.dispatchEvent(click);

    expect(notPrevented).toBe(true);
  });

  it('opens the menu via the keyboard Menu/Apps key', () => {
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('opens the menu via Shift+F10', () => {
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('opens the menu via ArrowDown (the WAI-ARIA menu-button convention, and the one Mac keyboards have)', () => {
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('opens the menu via Alt+ArrowDown', () => {
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('leaves unrelated keydowns alone', () => {
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('advertises the popup via aria-haspopup, and reflects open state via aria-expanded', () => {
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    menuItems()[1].click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('moves focus to the first menu item after opening via the keyboard', () => {
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(menuItems()[0]);
  });

  it('moves focus to the first menu item after opening via long-press', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(document.activeElement).toBe(menuItems()[0]);
  });

  it('returns focus to the trigger button after an option is selected', () => {
    button.focus();
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();
    expect(document.activeElement).toBe(menuItems()[0]);

    menuItems()[0].click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(button);
  });

  it('does not let a second concurrent pointer cancel or restart the first pointer\'s long-press', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 }));
    // A second finger touches down and moves far away -- must not affect pointer 1's gesture.
    button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 2, clientX: 0, clientY: 0 }));
    button.dispatchEvent(pointerEvent('pointermove', { pointerId: 2, clientX: 500, clientY: 500 }));
    button.dispatchEvent(pointerEvent('pointerup', { pointerId: 2 }));

    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItems().length).toBe(3);
  });

  it('does not throw and does not open the menu when the host is destroyed mid-press', () => {
    vi.useFakeTimers();
    button.dispatchEvent(pointerEvent('pointerdown'));

    fixture.destroy();

    expect(() => vi.advanceTimersByTime(500)).not.toThrow();
    expect(
      overlayContainer.getContainerElement().querySelectorAll('.roll-options-menu__item').length,
    ).toBe(0);
  });

  it('dismisses the menu on Escape', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();
    expect(menuItems().length).toBe(3);

    menuPanel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });

  it('returns focus to the trigger button after Escape dismissal (not stranded on <body>)', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();

    menuPanel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(button);
  });

  it('returns focus to the trigger button after an outside click that lands nowhere focusable', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();
    expect(menuItems().length).toBe(3);

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
    expect(document.activeElement).toBe(button);
  });

  it('does not steal focus back when an outside click lands on another focusable control', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();
    expect(menuItems().length).toBe(3);

    const outsideInput: HTMLInputElement = fixture.nativeElement.querySelector('#outside-input');
    outsideInput.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    outsideInput.focus();
    outsideInput.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
    expect(document.activeElement).toBe(outsideInput);
  });

  const cases: { index: number; option: RollOption }[] = [
    { index: 0, option: 'advantage' },
    { index: 1, option: 'normal' },
    { index: 2, option: 'disadvantage' },
  ];

  for (const { index, option } of cases) {
    it(`emits '${option}' when that menu item is activated`, () => {
      button.dispatchEvent(contextMenuEvent());
      fixture.detectChanges();

      menuItems()[index].click();
      fixture.detectChanges();

      expect(host.selections).toEqual([option]);
    });
  }

  it('closes the menu after an option is selected', () => {
    button.dispatchEvent(contextMenuEvent());
    fixture.detectChanges();

    menuItems()[0].click();
    fixture.detectChanges();

    expect(menuItems().length).toBe(0);
  });
});

@Component({
  template: `
    <button id="a" appRollOptions (rollOptionSelected)="recordA($event)">Roll Agility</button>
    <button id="b" appRollOptions (rollOptionSelected)="recordB($event)">Roll Strength</button>
  `,
  imports: [RollOptionsDirective],
})
class TwoTriggerTestHost {
  readonly selectionsA: RollOption[] = [];
  readonly selectionsB: RollOption[] = [];

  recordA(option: RollOption): void {
    this.selectionsA.push(option);
  }

  recordB(option: RollOption): void {
    this.selectionsB.push(option);
  }
}

// Regression coverage for a real cross-instance defect: CDK's own exclusivity tracker
// (_menuTracker) is only ever updated from CdkContextMenuTrigger's native contextmenu handler, so
// it never sees opens made through the public open() method -- exactly the path our keyboard and
// long-press gestures use. Without RollOptionsDirective's own openInstance tracking, long-pressing
// (or keyboard-opening) a second trigger left the first trigger's menu open too.
describe('RollOptionsDirective cross-instance exclusivity', () => {
  let fixture: ComponentFixture<TwoTriggerTestHost>;
  let buttonA: HTMLButtonElement;
  let buttonB: HTMLButtonElement;
  let overlayContainer: OverlayContainer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TwoTriggerTestHost] }).compileComponents();
    fixture = TestBed.createComponent(TwoTriggerTestHost);
    fixture.detectChanges();
    buttonA = fixture.nativeElement.querySelector('#a');
    buttonB = fixture.nativeElement.querySelector('#b');
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  function menuItemCount(): number {
    return overlayContainer.getContainerElement().querySelectorAll('.roll-options-menu__item').length;
  }

  it('closes trigger A\'s menu when trigger B is opened via long-press', () => {
    vi.useFakeTimers();
    buttonA.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(menuItemCount()).toBe(3); // only A's menu

    buttonB.dispatchEvent(pointerEvent('pointerdown'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(menuItemCount()).toBe(3); // B's menu replaced A's, not added to it
  });

  it('closes trigger A\'s menu when trigger B is opened via the keyboard', () => {
    buttonA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(menuItemCount()).toBe(3);

    buttonB.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(menuItemCount()).toBe(3);
  });
});
