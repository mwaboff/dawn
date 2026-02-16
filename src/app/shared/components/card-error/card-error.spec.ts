import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardError } from './card-error';

describe('CardError', () => {
  let fixture: ComponentFixture<CardError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardError],
    }).compileComponents();

    fixture = TestBed.createComponent(CardError);
    fixture.detectChanges();
  });

  it('should render the error title', () => {
    const title = fixture.nativeElement.querySelector('.error-title');
    expect(title.textContent.trim()).toBe('Failed to Load');
  });

  it('should render the error message', () => {
    const message = fixture.nativeElement.querySelector('.error-message');
    expect(message.textContent.trim()).toContain('Something went wrong');
  });

  it('should have role="alert" for accessibility', () => {
    const container = fixture.nativeElement.querySelector('.error-container');
    expect(container.getAttribute('role')).toBe('alert');
  });

  it('should render the SVG icon', () => {
    const svg = fixture.nativeElement.querySelector('.error-icon');
    expect(svg).toBeTruthy();
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });
});
