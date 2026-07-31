import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ErrorPage } from './error-page';

describe('ErrorPage', () => {
  let fixture: ComponentFixture<ErrorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPage);
  });

  it('should render 404 content by default', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.error-title');
    const eyebrow = fixture.nativeElement.querySelector('.error-eyebrow');
    expect(title.textContent).toContain('Lost in the Fog');
    expect(eyebrow.textContent.trim()).toBe('404');
  });

  it('should render 403 content when status is 403', () => {
    fixture.componentRef.setInput('status', 403);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.error-title');
    const eyebrow = fixture.nativeElement.querySelector('.error-eyebrow');
    expect(title.textContent).toContain('The Door is Locked');
    expect(eyebrow.textContent.trim()).toBe('403');
  });

  it('should render generic content for an unknown status', () => {
    fixture.componentRef.setInput('status', 500);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.error-title');
    const eyebrow = fixture.nativeElement.querySelector('.error-eyebrow');
    expect(title.textContent).toContain('Something Went Wrong');
    expect(eyebrow).toBeNull();
  });

  it('should link back to home', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.error-cta a');
    expect(link.getAttribute('href')).toBe('/');
  });
});
