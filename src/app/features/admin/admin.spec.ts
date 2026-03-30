import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Admin } from './admin';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render admin title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.admin-title');
    expect(title?.textContent).toContain('Admin Portal');
  });

  it('should render Card Manager tab', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.admin-tab');
    expect(tabs[0]?.textContent?.trim()).toBe('Card Manager');
  });

  it('should render Bulk Upload tab', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('.admin-tab');
    expect(tabs[1]?.textContent?.trim()).toBe('Bulk Upload');
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const outlet = compiled.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });
});
