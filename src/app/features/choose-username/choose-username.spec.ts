import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChooseUsername } from './choose-username';

describe('ChooseUsername', () => {
  let component: ChooseUsername;
  let fixture: ComponentFixture<ChooseUsername>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChooseUsername],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    fixture = TestBed.createComponent(ChooseUsername);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.auth-title');
    expect(title.textContent).toContain('Claim Your Name');

    const subtitle = fixture.nativeElement.querySelector('.auth-subtitle');
    expect(subtitle.textContent).toContain('Choose the name');
  });

  it('should have username form with validation', () => {
    const control = component.usernameControl;
    expect(control).toBeTruthy();

    control.setValue('');
    expect(control.hasError('required')).toBe(true);

    control.setValue('ab');
    expect(control.hasError('minlength')).toBe(true);

    control.setValue('a'.repeat(31));
    expect(control.hasError('maxlength')).toBe(true);

    control.setValue('invalid name!');
    expect(control.hasError('pattern')).toBe(true);

    control.setValue('valid_name-123');
    expect(control.valid).toBe(true);
  });

  it('should disable submit when form is invalid', () => {
    component.usernameControl.setValue('');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.auth-submit');
    expect(btn.disabled).toBe(true);
  });

  it('should enable submit when form is valid', () => {
    component.usernameControl.setValue('validname');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.auth-submit');
    expect(btn.disabled).toBe(false);
  });

  it('should submit and navigate on success', () => {
    const navigateSpy = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((component as any).router, 'navigate');
    component.usernameControl.setValue('coolname');

    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'coolname' });
    req.flush({
      id: 1, username: 'coolname', role: 'USER',
      createdAt: '2026-01-01T00:00:00', lastModifiedAt: '2026-01-01T00:00:00',
      usernameChosen: true
    });

    expect(component.isLoading()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should display error on 409 conflict', () => {
    component.usernameControl.setValue('taken');
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
    req.flush({ message: 'Username taken' }, { status: 409, statusText: 'Conflict' });

    expect(component.usernameError()).toContain('already taken');
    expect(component.isLoading()).toBe(false);
  });

  it('should display error on 400 bad request', () => {
    component.usernameControl.setValue('bad');
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
    req.flush({ message: 'Invalid username' }, { status: 400, statusText: 'Bad Request' });

    expect(component.usernameError()).toBe('Invalid username');
    expect(component.isLoading()).toBe(false);
  });

  it('should display generic error on unexpected failure', () => {
    component.usernameControl.setValue('name');
    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/choose-username');
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(component.usernameError()).toContain('Something went wrong');
  });

  it('should not submit when form is invalid', () => {
    component.usernameControl.setValue('');
    component.onSubmit();
    httpMock.expectNone('http://localhost:8080/api/auth/choose-username');
  });

  it('should show validation errors when field is touched', () => {
    component.usernameControl.markAsTouched();
    component.usernameControl.setValue('');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.field-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('required');
  });
});
