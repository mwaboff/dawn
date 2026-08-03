import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RunLifecycleActions } from './run-lifecycle-actions';
import { EncounterRunResponse } from '../../../../models/encounter-run-api.model';

const runsBaseUrl = 'http://localhost:8080/api/dh/encounter-runs';
const encountersBaseUrl = 'http://localhost:8080/api/dh/encounters';

function buildRun(overrides: Partial<EncounterRunResponse> = {}): EncounterRunResponse {
  return {
    id: 9,
    encounterId: 3,
    startedById: 1,
    status: 'ACTIVE',
    startedAt: '2026-01-01T00:00:00Z',
    adversaries: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastModifiedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('RunLifecycleActions', () => {
  let fixture: ComponentFixture<RunLifecycleActions>;
  let httpTesting: HttpTestingController;

  function setup(
    runId = 5,
    encounterId = 3,
    encounterLabel?: string,
    campaignId?: number,
    editHref?: string,
  ): void {
    TestBed.configureTestingModule({
      imports: [RunLifecycleActions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(RunLifecycleActions);
    fixture.componentRef.setInput('runId', runId);
    fixture.componentRef.setInput('encounterId', encounterId);
    if (encounterLabel !== undefined) fixture.componentRef.setInput('encounterLabel', encounterLabel);
    if (campaignId !== undefined) fixture.componentRef.setInput('campaignId', campaignId);
    if (editHref !== undefined) fixture.componentRef.setInput('editHref', editHref);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render Complete, Reset, and a Delete Encounter trashcan', () => {
    setup(5, 3, 'Pirate Ambush');

    expect(fixture.nativeElement.querySelector('.btn--primary').textContent.trim()).toBe('Complete Encounter');
    expect(fixture.nativeElement.querySelector('.btn--secondary').textContent.trim()).toBe('Reset');
    const trash = fixture.nativeElement.querySelector('.roster-delete-btn');
    expect(trash.getAttribute('aria-label')).toBe('Delete Pirate Ambush');
  });

  it('should give the delete trashcan a visible tooltip, since it is glyph-only', () => {
    setup();

    expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__delete-wrap').getAttribute('title')).toBeTruthy();
  });

  it('should warn that deleting the encounter also destroys the in-progress run\'s live state, not just show the generic "Delete?"', () => {
    // Regression coverage: the backend cascades a DELETE onto the encounter's own ACTIVE run in
    // the same transaction, so this is the one InlineDeleteConfirm call site where the generic
    // confirmation (every other call site's default) would understate what's actually at stake --
    // a GM mid-fight could lose live HP/Stress/tokens/notes with no warning it was on the table.
    setup();
    fixture.nativeElement.querySelector('.roster-delete-btn').click();
    fixture.detectChanges();

    const text = fixture.nativeElement.querySelector('.roster-inline-confirm-text').textContent;
    expect(text).toContain('saved encounter');
    expect(text).toMatch(/HP.*Stress.*tokens.*notes/);
  });

  it('should scope the "can\'t be recovered" claim to the run\'s live state only, not the encounter itself', () => {
    // The encounter delete is soft (EncounterService.deleteEncounter has an admin-only restore
    // endpoint); the run delete is hard, nothing to restore from. A single blanket closer over
    // both halves would overstate the encounter side -- see this component's `deleteConfirmText`
    // doc for the full reasoning, and `encounters.html`'s matching copy for the other surface this
    // is meant to read consistently with.
    setup();
    fixture.nativeElement.querySelector('.roster-delete-btn').click();
    fixture.detectChanges();

    const text = fixture.nativeElement.querySelector('.roster-inline-confirm-text').textContent;
    // The encounter clause is a full, self-contained sentence ("Deletes the saved encounter.") --
    // not a greedy substring check (which "recovered" appears somewhere after "encounter" would
    // pass trivially regardless of scoping), this asserts the actual sentence break exists, so the
    // recovery claim can only be read as attaching to the clause that follows it.
    expect(text).toMatch(/\bencounter\.\s/);
    const encounterSentenceEnd = text.indexOf('encounter.') + 'encounter.'.length;
    const liveStateIndex = text.search(/HP.*Stress.*tokens.*notes/);
    const recoveredIndex = text.search(/recovered|undone/i);
    expect(liveStateIndex).toBeGreaterThan(encounterSentenceEnd);
    expect(recoveredIndex).toBeGreaterThan(liveStateIndex);
  });

  describe('Complete', () => {
    it('should POST to complete and emit completed on success', () => {
      setup();
      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      fixture.nativeElement.querySelector('.btn--primary').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn--primary').disabled).toBe(true);

      const req = httpTesting.expectOne(`${runsBaseUrl}/5/complete`);
      expect(req.request.method).toBe('POST');
      req.flush({});
      fixture.detectChanges();

      expect(completedCount).toBe(1);
    });

    it('should show an inline error and not emit completed when complete fails', () => {
      setup();
      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      fixture.nativeElement.querySelector('.btn--primary').click();
      fixture.detectChanges();
      httpTesting.expectOne(`${runsBaseUrl}/5/complete`).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(completedCount).toBe(0);
      const error = fixture.nativeElement.querySelector('.run-lifecycle-actions__error');
      expect(error).toBeTruthy();
      expect(error.getAttribute('role')).toBe('alert');
      expect(fixture.nativeElement.querySelector('.btn--primary').disabled).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should ask for confirmation via a modal before resetting', () => {
      setup();

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeTruthy();
    });

    it('should not touch the network when the reset dialog is cancelled', () => {
      setup();

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--cancel').click();
      fixture.detectChanges();

      httpTesting.expectNone(`${runsBaseUrl}/5`);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('should delete the old run, start a fresh one for the same encounter, and emit it once confirmed', () => {
      setup(5, 3);
      let resetRun: EncounterRunResponse | null = null;
      fixture.componentInstance.runReset.subscribe(run => (resetRun = run));

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--confirm').click();
      fixture.detectChanges();

      const deleteReq = httpTesting.expectOne(`${runsBaseUrl}/5`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);
      fixture.detectChanges();

      const startReq = httpTesting.expectOne(`${encountersBaseUrl}/3/runs`);
      expect(startReq.request.method).toBe('POST');
      const freshRun = buildRun({ id: 10 });
      startReq.flush(freshRun);
      fixture.detectChanges();

      expect(resetRun).toEqual(freshRun);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('should preserve campaignId when starting the replacement run', () => {
      setup(5, 3, undefined, 42);

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--confirm').click();
      fixture.detectChanges();

      httpTesting.expectOne(`${runsBaseUrl}/5`).flush(null);
      fixture.detectChanges();

      const startReq = httpTesting.expectOne(`${encountersBaseUrl}/3/runs`);
      expect(startReq.request.body).toEqual({ campaignId: 42 });
      startReq.flush(buildRun());
    });

    it('should surface an inline error and not emit reset when the delete half fails', () => {
      setup();
      let resetCount = 0;
      fixture.componentInstance.runReset.subscribe(() => resetCount++);

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--confirm').click();
      fixture.detectChanges();

      httpTesting.expectOne(`${runsBaseUrl}/5`).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(resetCount).toBe(0);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
      const error = fixture.nativeElement.querySelector('.run-lifecycle-actions__error');
      expect(error.textContent).toContain("reset");
    });

    it('should collapse the delete trashcan confirm when reset is requested, so only one confirmation shows at a time', () => {
      setup();

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.roster-inline-confirm')).toBeTruthy();

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.roster-inline-confirm')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeTruthy();
    });
  });

  describe('Delete Encounter', () => {
    it('should show the inline Yes/No confirm when the trashcan is clicked', () => {
      setup();

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.roster-inline-confirm')).toBeTruthy();
    });

    it('should not touch the network when the inline confirm is cancelled', () => {
      setup();

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.roster-inline-cancel-btn').click();
      fixture.detectChanges();

      httpTesting.expectNone(`${encountersBaseUrl}/3`);
      expect(fixture.nativeElement.querySelector('.roster-inline-confirm')).toBeFalsy();
    });

    it('should DELETE the encounter and emit encounterDeleted once confirmed', () => {
      setup(5, 3);
      let deletedCount = 0;
      fixture.componentInstance.encounterDeleted.subscribe(() => deletedCount++);

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.roster-inline-confirm-btn').click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${encountersBaseUrl}/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      fixture.detectChanges();

      expect(deletedCount).toBe(1);
    });

    it('should surface an inline error and not emit encounterDeleted when the delete fails', () => {
      setup();
      let deletedCount = 0;
      fixture.componentInstance.encounterDeleted.subscribe(() => deletedCount++);

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.roster-inline-confirm-btn').click();
      fixture.detectChanges();

      httpTesting.expectOne(`${encountersBaseUrl}/3`).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(deletedCount).toBe(0);
      const error = fixture.nativeElement.querySelector('.run-lifecycle-actions__error');
      expect(error.getAttribute('role')).toBe('alert');
    });

    it('should collapse the reset confirm dialog when delete is requested, so only one confirmation shows at a time', () => {
      setup();

      fixture.nativeElement.querySelector('.btn--secondary').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeTruthy();

      fixture.nativeElement.querySelector('.roster-delete-btn').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.roster-inline-confirm')).toBeTruthy();
    });
  });

  describe('Edit', () => {
    it('should not render an Edit control when no editHref is supplied', () => {
      setup();

      expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-wrap')).toBeFalsy();
    });

    it('should open the encounter editor in a new tab at the given href, with an accessible name announcing that', () => {
      setup(5, 3, 'Pirate Ambush', undefined, '/encounters/3/edit');

      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-wrap a');
      expect(link.getAttribute('href')).toBe('/encounters/3/edit');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener');
      expect(link.getAttribute('aria-label')).toBe('Edit Pirate Ambush (opens in a new tab)');
    });

    it('should sit on the non-destructive side, grouped with Complete/Reset and set off from Delete by the same divider', () => {
      setup(5, 3, undefined, undefined, '/encounters/3/edit');

      const children = Array.from<Element>(fixture.nativeElement.querySelector('.run-lifecycle-actions').children);
      const editIndex = children.findIndex(el => el.classList.contains('run-lifecycle-actions__edit-wrap'));
      const deleteIndex = children.findIndex(el => el.classList.contains('run-lifecycle-actions__delete-wrap'));

      expect(editIndex).toBeGreaterThan(-1);
      expect(editIndex).toBeLessThan(deleteIndex);
      // The divider (border-left + margin-left: auto) lives on the delete wrap itself -- Edit is
      // the last element before it, not inside it, so it never inherits that visual separation by
      // accident; the two remain distinct elements with the delete-wrap's own rule the only thing
      // between them.
      expect(getComputedStyle(children[deleteIndex] as Element).marginLeft).toBe('auto');
    });

    it('should show an on-demand explanatory note only after Edit is clicked, not by default', () => {
      setup(5, 3, undefined, undefined, '/encounters/3/edit');

      expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note')).toBeFalsy();

      fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-wrap a').click();
      fixture.detectChanges();

      const note = fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note');
      expect(note).toBeTruthy();
      expect(note.getAttribute('role')).toBe('status');
      expect(note.getAttribute('aria-live')).toBe('polite');
      expect(note.textContent).toContain('next time this encounter runs');
    });

    it('should dismiss the note via its close button', () => {
      setup(5, 3, undefined, undefined, '/encounters/3/edit');

      fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-wrap a').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note-dismiss').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note')).toBeFalsy();
    });

    it('should dismiss the note via Escape, dispatched from the anchor -- where focus actually sits after Edit is clicked', () => {
      // The listener is a host binding on this component (see its `@Component` doc), not an
      // attribute on the note itself -- a GM's focus stays on the <a> they just clicked (the note
      // is a non-focus-stealing popover), so an Escape keypress bubbles up from the anchor, never
      // fires on the note directly. A test that dispatches straight from the note (as this one
      // used to) would pass even if the listener were wired to an element the anchor's real
      // keydown bubbling never reaches.
      setup(5, 3, undefined, undefined, '/encounters/3/edit');

      const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-wrap a');
      anchor.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note')).toBeTruthy();

      anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.run-lifecycle-actions__edit-note')).toBeFalsy();
    });
  });
});
