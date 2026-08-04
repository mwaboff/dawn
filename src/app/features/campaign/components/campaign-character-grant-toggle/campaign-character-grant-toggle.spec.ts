import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignCharacterGrantToggle } from './campaign-character-grant-toggle';

@Component({
  template: `
    <app-campaign-character-grant-toggle
      [enabled]="enabled()"
      label="Companions"
      [statusText]="statusText()"
      [saving]="saving()"
      (toggled)="toggledCount = toggledCount + 1"
    />
  `,
  imports: [CampaignCharacterGrantToggle],
})
class TestHost {
  enabled = signal(false);
  statusText = signal("Kael can't create a new companion.");
  saving = signal(false);
  toggledCount = 0;
}

describe('CampaignCharacterGrantToggle', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  function button(): HTMLButtonElement {
    return el.querySelector('.grant-toggle-btn') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should label the button with the action it performs when currently off', () => {
    expect(button().textContent?.trim()).toBe('Turn on');
  });

  it('should label the button with the action it performs when currently on', () => {
    host.enabled.set(true);
    fixture.detectChanges();

    expect(button().textContent?.trim()).toBe('Turn off');
  });

  it('should name the grant in the accessible label', () => {
    expect(button().getAttribute('aria-label')).toBe('Turn on Companions');
  });

  it('should render the status text', () => {
    expect(el.querySelector('.grant-toggle-status')?.textContent?.trim())
      .toBe("Kael can't create a new companion.");
  });

  it('should emit toggled when clicked', () => {
    button().click();

    expect(host.toggledCount).toBe(1);
  });

  it('should disable the button while saving', () => {
    host.saving.set(true);
    fixture.detectChanges();

    expect(button().disabled).toBe(true);
  });

  it('should not emit toggled while saving', () => {
    host.saving.set(true);
    fixture.detectChanges();

    button().click();

    expect(host.toggledCount).toBe(0);
  });
});
