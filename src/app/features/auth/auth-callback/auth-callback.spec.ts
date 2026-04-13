import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthCallback } from './auth-callback';

describe('AuthCallback', () => {
  it('should create', () => {
    TestBed.configureTestingModule({
      imports: [AuthCallback],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AuthCallback);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display completing message', () => {
    TestBed.configureTestingModule({
      imports: [AuthCallback],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AuthCallback);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.callback-message');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Completing sign-in');
  });
});
