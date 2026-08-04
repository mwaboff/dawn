import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { ResourceTracker, ResourceTrackerVariant } from './resource-tracker';

@Component({
  imports: [ResourceTracker],
  template: `
    <app-resource-tracker
      [max]="max()"
      [marked]="marked()"
      [label]="label()"
      [variant]="variant()"
      [idPrefix]="idPrefix()"
      [ariaLabel]="ariaLabel()"
      [bonusCount]="bonusCount()"
      (markedChange)="onMarkedChange($event)"
    >
      @if (withProjectedContent()) {
        <span class="projected">indicator</span>
      }
    </app-resource-tracker>
  `,
})
class TestHost {
  max = signal(5);
  marked = signal(2);
  label = signal('HP');
  variant = signal<ResourceTrackerVariant>('default');
  idPrefix = signal('');
  ariaLabel = signal('');
  bonusCount = signal(0);
  withProjectedContent = signal(false);
  lastEmitted: number | null = null;

  onMarkedChange(value: number): void {
    this.lastEmitted = value;
  }
}

describe('ResourceTracker', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function boxes(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.resource-box'));
  }

  it('renders one box per max', () => {
    expect(boxes().length).toBe(5);
  });

  it('renders no boxes when max is 0', () => {
    host.max.set(0);
    fixture.detectChanges();

    expect(boxes().length).toBe(0);
  });

  it('marks boxes up to and including the marked count', () => {
    const marked = boxes().filter(b => b.classList.contains('resource-box--marked'));
    expect(marked.length).toBe(2);
  });

  it('renders the label when provided', () => {
    const label = fixture.nativeElement.querySelector('.resource-row__label');
    expect(label.textContent.trim()).toBe('HP');
  });

  it('omits the label element when label is empty', () => {
    host.label.set('');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.resource-row__label');
    expect(label).toBeFalsy();
  });

  it('renders the marked/max count', () => {
    const count = fixture.nativeElement.querySelector('.resource-row__count');
    expect(count.textContent.trim()).toBe('2/5');
  });

  it('does not apply the hope class by default', () => {
    expect(boxes()[0].classList.contains('resource-box--hope')).toBe(false);
  });

  it('applies the hope class when variant is hope', () => {
    host.variant.set('hope');
    fixture.detectChanges();

    expect(boxes()[0].classList.contains('resource-box--hope')).toBe(true);
  });

  it('applies the stress class when variant is stress', () => {
    host.variant.set('stress');
    fixture.detectChanges();

    expect(boxes()[0].classList.contains('resource-box--stress')).toBe(true);
  });

  it('emits the clicked index when marking up', () => {
    boxes()[3].click();

    expect(host.lastEmitted).toBe(4);
  });

  it('emits one less than the clicked index when the already-marked top box is clicked again', () => {
    boxes()[1].click();

    expect(host.lastEmitted).toBe(1);
  });

  it('does not emit a value below 0', () => {
    host.marked.set(1);
    fixture.detectChanges();

    boxes()[0].click();

    expect(host.lastEmitted).toBe(0);
  });

  it('marks all the way to max when the last box is clicked', () => {
    boxes()[4].click();

    expect(host.lastEmitted).toBe(5);
  });

  it('sets aria-pressed true for marked boxes', () => {
    expect(boxes()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('sets aria-pressed false for unmarked boxes', () => {
    expect(boxes()[2].getAttribute('aria-pressed')).toBe('false');
  });

  it('uses the label as the aria-label prefix by default', () => {
    expect(boxes()[0].getAttribute('aria-label')).toBe('HP 1');
  });

  it('uses ariaLabel instead of label when both are provided', () => {
    host.ariaLabel.set('Hit Points');
    fixture.detectChanges();

    expect(boxes()[0].getAttribute('aria-label')).toBe('Hit Points 1');
  });

  it('applies aria-label even when the visible label is omitted', () => {
    host.label.set('');
    host.ariaLabel.set('Hope');
    fixture.detectChanges();

    expect(boxes()[0].getAttribute('aria-label')).toBe('Hope 1');
  });

  it('assigns per-box ids prefixed with idPrefix when provided', () => {
    host.idPrefix.set('hp');
    fixture.detectChanges();

    expect(boxes()[0].id).toBe('hp-1');
    expect(boxes()[4].id).toBe('hp-5');
  });

  it('omits the id attribute when idPrefix is not provided', () => {
    expect(boxes()[0].hasAttribute('id')).toBe(false);
  });

  it('projects host content after the count', () => {
    host.withProjectedContent.set(true);
    fixture.detectChanges();

    const projected = fixture.nativeElement.querySelector('.projected');
    expect(projected).toBeTruthy();
  });

  describe('bonusCount', () => {
    it('renders max + bonusCount boxes', () => {
      host.bonusCount.set(2);
      fixture.detectChanges();

      expect(boxes().length).toBe(7);
    });

    it('marks the trailing bonus boxes with the companion class, not the base boxes', () => {
      host.bonusCount.set(2);
      fixture.detectChanges();

      const flags = boxes().map(b => b.classList.contains('resource-box--companion'));
      expect(flags).toEqual([false, false, false, false, false, true, true]);
    });

    it('shows the bonus total in the marked/max count', () => {
      host.bonusCount.set(2);
      fixture.detectChanges();

      const count = fixture.nativeElement.querySelector('.resource-row__count');
      expect(count.textContent.trim()).toBe('2/7');
    });

    it('allows marking all the way into the bonus range, not just up to the base max', () => {
      host.bonusCount.set(2);
      fixture.detectChanges();

      boxes()[6].click();

      expect(host.lastEmitted).toBe(7);
    });

    it('does not clamp a bonus-box click down to the base max', () => {
      // Regression guard: toggle()'s clamp ceiling must be totalBoxes(), not max() -- with the
      // old max()-only clamp, clicking a bonus box silently emitted max() instead of the bonus index.
      host.bonusCount.set(2);
      fixture.detectChanges();

      boxes()[5].click();

      expect(host.lastEmitted).toBe(6);
      expect(host.lastEmitted).not.toBe(host.max());
    });

    it('defaults to no bonus boxes when bonusCount is not provided', () => {
      expect(boxes().length).toBe(5);
    });
  });
});
