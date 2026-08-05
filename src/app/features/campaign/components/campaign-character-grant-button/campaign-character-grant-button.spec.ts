import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignCharacterGrantButton } from './campaign-character-grant-button';

@Component({
  template: `
    <!-- Mirrors the real ancestor (character-entry) this button sits inside: a clickable row with
         the keyboard equivalent, whose own click handler this button's stopPropagation guards against. -->
    <div role="button" tabindex="0" (click)="parentClicked = true" (keydown.enter)="parentClicked = true">
      <app-campaign-character-grant-button
        label="Companions"
        [on]="on()"
        [expanded]="expanded()"
        controlsId="companion-control-10"
        (clicked)="clickedCount = clickedCount + 1"
      />
    </div>
  `,
  imports: [CampaignCharacterGrantButton],
})
class TestHost {
  on = signal(false);
  expanded = signal(false);
  clickedCount = 0;
  parentClicked = false;
}

describe('CampaignCharacterGrantButton', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function button(): HTMLButtonElement {
    return el.querySelector('.grant-btn') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render the label', () => {
    expect(button().textContent?.trim()).toBe('Companions');
  });

  it('should not show a badge when off', () => {
    expect(el.querySelector('.grant-badge')).toBeFalsy();
  });

  it('should show the On badge when on', () => {
    host.on.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.grant-badge')?.textContent?.trim()).toBe('On');
  });

  it('should link to the drawer via aria-controls', () => {
    expect(button().getAttribute('aria-controls')).toBe('companion-control-10');
  });

  it('should reflect aria-expanded from the input', () => {
    host.expanded.set(true);
    fixture.detectChanges();

    expect(button().getAttribute('aria-expanded')).toBe('true');
  });

  it('should emit clicked when clicked', () => {
    button().click();

    expect(host.clickedCount).toBe(1);
  });

  it('should stop the click from bubbling to an ancestor handler', () => {
    button().click();

    expect(host.parentClicked).toBe(false);
  });
});
