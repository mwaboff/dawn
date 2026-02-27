import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { CardFeatureItem } from './card-feature-item';
import { CardFeature } from '../daggerheart-card.model';

const MOCK_FEATURE: CardFeature = {
  name: 'Make a Scene',
  description: 'Spend 3 Hope to Distract a target.',
  subtitle: 'Hope Feature',
  tags: ['3 Hope', 'Action'],
};

@Component({
  imports: [CardFeatureItem],
  template: `<app-card-feature-item [feature]="feature()" />`,
})
class TestHost {
  feature = signal<CardFeature>(MOCK_FEATURE);
}

describe('CardFeatureItem', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render feature name', () => {
    const name = fixture.nativeElement.querySelector('.card__feature-name');
    expect(name.textContent.trim()).toBe('Make a Scene');
  });

  it('should render feature description with HTML formatting', () => {
    host.feature.set({ ...MOCK_FEATURE, description: 'Line one\nLine two' });
    fixture.detectChanges();

    const desc = fixture.nativeElement.querySelector('.card__feature-description');
    expect(desc.innerHTML).toContain('<br>');
    expect(desc.textContent).toContain('Line one');
    expect(desc.textContent).toContain('Line two');
  });

  it('should render subtitle when provided', () => {
    const subtitle = fixture.nativeElement.querySelector('.card__feature-subtitle');
    expect(subtitle.textContent.trim()).toBe('Hope Feature');
  });

  it('should not render subtitle when not provided', () => {
    host.feature.set({ name: 'Ability', description: 'Does something.' });
    fixture.detectChanges();

    const subtitle = fixture.nativeElement.querySelector('.card__feature-subtitle');
    expect(subtitle).toBeFalsy();
  });

  it('should render tags when provided', () => {
    const tags = fixture.nativeElement.querySelectorAll('.card__feature-tag');
    expect(tags.length).toBe(2);
    expect(tags[0].textContent.trim()).toBe('3 Hope');
    expect(tags[1].textContent.trim()).toBe('Action');
  });

  it('should not render tags section when no tags', () => {
    host.feature.set({ name: 'Ability', description: 'Does something.' });
    fixture.detectChanges();

    const tagsContainer = fixture.nativeElement.querySelector('.card__feature-tags');
    expect(tagsContainer).toBeFalsy();
  });

  it('should escape HTML in descriptions', () => {
    host.feature.set({ ...MOCK_FEATURE, description: '<script>alert("xss")</script>' });
    fixture.detectChanges();

    const desc = fixture.nativeElement.querySelector('.card__feature-description');
    expect(desc.innerHTML).not.toContain('<script>');
    expect(desc.textContent).toContain('<script>alert("xss")</script>');
  });
});
