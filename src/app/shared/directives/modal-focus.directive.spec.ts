import { describe, it, expect, beforeEach } from 'vitest';
import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalFocusDirective } from './modal-focus.directive';

@Component({
  template: `
    <button class="opener-btn" (click)="open.set(true)">Open</button>
    @if (open()) {
      <div class="host-panel" appModalFocus (escape)="onEscape()">
        <button class="first-btn">First</button>
        <input class="middle-input" />
        <button class="last-btn">Last</button>
      </div>
    }
  `,
  imports: [ModalFocusDirective],
})
class TestHost {
  readonly open = signal(false);
  escapeCount = 0;
  onEscape(): void {
    this.escapeCount++;
  }
}

@Component({
  template: `
    <div class="host-panel" appModalFocus>
      <input class="autofocus-input" />
      <button class="autofocus-btn">Focus me</button>
    </div>
  `,
  imports: [ModalFocusDirective],
})
class AutofocusHost {}

describe('ModalFocusDirective', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    document.body.style.overflow = '';
  });

  it('creates without a panel present', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.host-panel')).toBeNull();
  });

  it('focuses the first focusable element when no [autofocus] is present', () => {
    host.open.set(true);
    fixture.detectChanges();

    const firstBtn = fixture.nativeElement.querySelector('.first-btn');
    expect(document.activeElement).toBe(firstBtn);
  });

  it('returns focus to the element that was focused before the panel opened', () => {
    fixture.detectChanges();
    const opener: HTMLButtonElement = fixture.nativeElement.querySelector('.opener-btn');
    opener.focus();
    expect(document.activeElement).toBe(opener);

    host.open.set(true);
    fixture.detectChanges();
    expect(document.activeElement).not.toBe(opener);

    host.open.set(false);
    fixture.detectChanges();
    expect(document.activeElement).toBe(opener);
  });

  it('locks body scroll while open and restores it on destroy', () => {
    expect(document.body.style.overflow).toBe('');

    host.open.set(true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    host.open.set(false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });

  it('restores a pre-existing body overflow value on destroy instead of clobbering it', () => {
    document.body.style.overflow = 'scroll';

    host.open.set(true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    host.open.set(false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('scroll');

    document.body.style.overflow = '';
  });

  it('emits escape on the Escape key', () => {
    host.open.set(true);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.host-panel');
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(host.escapeCount).toBe(1);
  });

  it('does not emit escape on other keys', () => {
    host.open.set(true);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.host-panel');
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.escapeCount).toBe(0);
  });

  it('wraps Tab from the last focusable element back to the first', () => {
    host.open.set(true);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.host-panel');
    const lastBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.last-btn');
    const firstBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.first-btn');
    lastBtn.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel.dispatchEvent(event);

    expect(document.activeElement).toBe(firstBtn);
  });

  it('wraps Shift+Tab from the first focusable element back to the last', () => {
    host.open.set(true);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.host-panel');
    const lastBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.last-btn');
    const firstBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.first-btn');
    firstBtn.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    panel.dispatchEvent(event);

    expect(document.activeElement).toBe(lastBtn);
  });

  it('does not move focus on Tab from a middle element', () => {
    host.open.set(true);
    fixture.detectChanges();

    const panel: HTMLElement = fixture.nativeElement.querySelector('.host-panel');
    const middleInput: HTMLInputElement = fixture.nativeElement.querySelector('.middle-input');
    middleInput.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel.dispatchEvent(event);

    expect(document.activeElement).toBe(middleInput);
  });

  it('does nothing on the server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const serverFixture = TestBed.createComponent(TestHost);
    const serverHost = serverFixture.componentInstance;

    expect(() => {
      serverHost.open.set(true);
      serverFixture.detectChanges();
      serverHost.open.set(false);
      serverFixture.detectChanges();
    }).not.toThrow();
  });
});

describe('ModalFocusDirective with [autofocus]', () => {
  it('focuses the [autofocus] element instead of the first focusable one', async () => {
    await TestBed.configureTestingModule({ imports: [AutofocusHost] }).compileComponents();
    const fixture = TestBed.createComponent(AutofocusHost);
    // Set imperatively rather than in the template: a literal `autofocus` attribute trips the
    // no-autofocus lint rule, and this test exists precisely to prove the directive respects one
    // when a consumer sets it deliberately (e.g. via a Renderer2 call), not to model good markup.
    const autofocusBtn = fixture.nativeElement.querySelector('.autofocus-btn') as HTMLElement;
    autofocusBtn.setAttribute('autofocus', '');
    fixture.detectChanges();

    expect(document.activeElement).toBe(autofocusBtn);
  });
});
