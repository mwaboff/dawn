import { describe, it, expect, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RunLifecycleActions } from './run-lifecycle-actions';

const runsBaseUrl = 'http://localhost:8080/api/dh/encounter-runs';

describe('RunLifecycleActions', () => {
  let fixture: ComponentFixture<RunLifecycleActions>;
  let httpTesting: HttpTestingController;

  function setup(runId = 5): void {
    TestBed.configureTestingModule({
      imports: [RunLifecycleActions],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(RunLifecycleActions);
    fixture.componentRef.setInput('runId', runId);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpTesting.verify();
  });

  it('should render Complete and Discard controls', () => {
    setup();

    expect(fixture.nativeElement.querySelector('.btn--primary').textContent.trim()).toBe('Complete Encounter');
    expect(fixture.nativeElement.querySelector('.btn--danger-ghost').textContent.trim()).toBe('Discard');
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

  describe('Discard', () => {
    it('should ask for confirmation before deleting', () => {
      setup();

      fixture.nativeElement.querySelector('.btn--danger-ghost').click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeTruthy();
    });

    it('should not delete when the dialog is cancelled', () => {
      setup();

      fixture.nativeElement.querySelector('.btn--danger-ghost').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--cancel').click();
      fixture.detectChanges();

      httpTesting.expectNone(`${runsBaseUrl}/5`);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('should DELETE and emit completed once confirmed -- a 204 through HttpClient resolves as null, not undefined', () => {
      setup();
      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      fixture.nativeElement.querySelector('.btn--danger-ghost').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--confirm').click();
      fixture.detectChanges();

      const req = httpTesting.expectOne(`${runsBaseUrl}/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      fixture.detectChanges();

      expect(completedCount).toBe(1);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('should close the dialog and surface an inline error when discard fails, so the error is visible and the GM can retry', () => {
      setup();
      let completedCount = 0;
      fixture.componentInstance.completed.subscribe(() => completedCount++);

      fixture.nativeElement.querySelector('.btn--danger-ghost').click();
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.dialog-btn--confirm').click();
      fixture.detectChanges();

      httpTesting.expectOne(`${runsBaseUrl}/5`).flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(completedCount).toBe(0);
      expect(fixture.nativeElement.querySelector('.dialog-backdrop')).toBeFalsy();
      const error = fixture.nativeElement.querySelector('.run-lifecycle-actions__error');
      expect(error.getAttribute('role')).toBe('alert');
    });
  });
});
