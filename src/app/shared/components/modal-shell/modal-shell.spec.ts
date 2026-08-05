import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ModalShell } from './modal-shell';

@Component({
  template: `
    <app-modal-shell [title]="title()" [processing]="processing()" [surface]="surface()" (dismissed)="onDismissed()">
      <p modal-body class="body-content">Body content</p>
      <ng-container modal-actions>
        <button type="button" class="action-btn">Action</button>
      </ng-container>
    </app-modal-shell>
  `,
  imports: [ModalShell],
})
class TestHost {
  readonly title = signal('Test Title');
  readonly processing = signal(false);
  readonly surface = signal<'parchment' | 'sheet'>('parchment');
  dismissedCount = 0;

  onDismissed(): void {
    this.dismissedCount++;
  }
}

describe('ModalShell', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('defaults to the light parchment surface', () => {
    expect(el.querySelector('.dialog-panel')?.classList).not.toContain('dialog-panel--sheet');
  });

  it('switches to the dark sheet surface when asked', () => {
    host.surface.set('sheet');
    fixture.detectChanges();

    expect(el.querySelector('.dialog-panel')?.classList).toContain('dialog-panel--sheet');
  });

  it('wraps the projected body so a tall dialog scrolls its body, not the page', () => {
    expect(el.querySelector('.dialog-body .body-content')).toBeTruthy();
  });

  it('renders the title and wires it via aria-labelledby', () => {
    const backdrop = el.querySelector('.dialog-backdrop')!;
    const titleEl = el.querySelector('.dialog-title')!;

    expect(titleEl.textContent?.trim()).toBe('Test Title');
    expect(backdrop.getAttribute('aria-labelledby')).toBe(titleEl.id);
    expect(titleEl.id).toBeTruthy();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const backdrop = el.querySelector('.dialog-backdrop')!;
    expect(backdrop.getAttribute('role')).toBe('dialog');
    expect(backdrop.getAttribute('aria-modal')).toBe('true');
  });

  it('renders projected body and actions content', () => {
    expect(el.querySelector('.body-content')?.textContent?.trim()).toBe('Body content');
    expect(el.querySelector('.action-btn')?.textContent?.trim()).toBe('Action');
  });

  it('emits dismissed when the backdrop is clicked directly', () => {
    el.querySelector<HTMLElement>('.dialog-backdrop')!.click();

    expect(host.dismissedCount).toBe(1);
  });

  it('does not emit dismissed when the panel is clicked', () => {
    el.querySelector<HTMLElement>('.dialog-panel')!.click();

    expect(host.dismissedCount).toBe(0);
  });

  it('does not emit dismissed on backdrop click while processing', () => {
    host.processing.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLElement>('.dialog-backdrop')!.click();

    expect(host.dismissedCount).toBe(0);
  });

  it('emits dismissed on Escape', () => {
    const backdrop = el.querySelector<HTMLElement>('.dialog-backdrop')!;
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(host.dismissedCount).toBe(1);
  });

  it('does not emit dismissed on Escape while processing', () => {
    host.processing.set(true);
    fixture.detectChanges();

    const backdrop = el.querySelector<HTMLElement>('.dialog-backdrop')!;
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(host.dismissedCount).toBe(0);
  });
});
