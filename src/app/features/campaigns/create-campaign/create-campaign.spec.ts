import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CreateCampaign } from './create-campaign';

describe('CreateCampaign', () => {
  let fixture: ComponentFixture<CreateCampaign>;
  let component: CreateCampaign;
  let el: HTMLElement;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCampaign],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCampaign);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when name is empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should have a valid form when name is filled', () => {
    component.form.controls.name.setValue('My Campaign');

    expect(component.form.valid).toBe(true);
  });

  it('should disable submit button when form is invalid', () => {
    const btn = el.querySelector('.form-submit-btn') as HTMLButtonElement;

    expect(btn.disabled).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.form.controls.name.setValue('My Campaign');
    fixture.detectChanges();
    const btn = el.querySelector('.form-submit-btn') as HTMLButtonElement;

    expect(btn.disabled).toBe(false);
  });

  it('should show required error when name is touched and empty', () => {
    component.form.controls.name.markAsTouched();
    fixture.detectChanges();

    expect(el.querySelector('.form-error')?.textContent?.trim()).toContain('required');
  });

  it('should submit and navigate on success', () => {
    const navigateSpy = vitest.spyOn(router, 'navigate');
    component.form.controls.name.setValue('New Adventure');
    component.form.controls.description.setValue('A test');
    component.onSubmit();

    const req = httpTesting.expectOne(r => r.url.includes('/dh/campaigns') && r.method === 'POST');
    expect(req.request.body.name).toBe('New Adventure');
    req.flush({ id: 7, name: 'New Adventure', creatorId: 1, gameMasterIds: [1], playerIds: [], pendingCharacterSheetIds: [], playerCharacterIds: [], nonPlayerCharacterIds: [], createdAt: '', lastModifiedAt: '' });

    expect(navigateSpy).toHaveBeenCalledWith(['/campaign', 7]);
  });

  it('should show error message on HTTP error', () => {
    component.form.controls.name.setValue('Fail');
    component.onSubmit();

    const req = httpTesting.expectOne(r => r.url.includes('/dh/campaigns') && r.method === 'POST');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('.form-error-message')?.textContent?.trim()).toContain('Something went wrong');
  });

  it('should navigate to campaigns on cancel', () => {
    const navigateSpy = vitest.spyOn(router, 'navigate');
    component.onCancel();

    expect(navigateSpy).toHaveBeenCalledWith(['/campaigns']);
  });

  it('should not submit when already submitting', () => {
    component.form.controls.name.setValue('Test');
    component.onSubmit();
    component.onSubmit();

    const reqs = httpTesting.match(r => r.url.includes('/dh/campaigns') && r.method === 'POST');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ id: 1, name: 'Test', creatorId: 1, gameMasterIds: [1], playerIds: [], pendingCharacterSheetIds: [], playerCharacterIds: [], nonPlayerCharacterIds: [], createdAt: '', lastModifiedAt: '' });
  });
});
