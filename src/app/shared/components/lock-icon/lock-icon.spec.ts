import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LockIcon } from './lock-icon';

describe('LockIcon', () => {
  let fixture: ComponentFixture<LockIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LockIcon] }).compileComponents();
    fixture = TestBed.createComponent(LockIcon);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render exactly one decorative svg glyph', () => {
    const svgs = fixture.nativeElement.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
    expect(svgs[0].getAttribute('aria-hidden')).toBe('true');
  });
});
