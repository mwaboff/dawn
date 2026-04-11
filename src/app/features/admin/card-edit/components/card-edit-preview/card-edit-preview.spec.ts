import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { CardEditPreview } from './card-edit-preview';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';

const MOCK_CARD: CardData = {
  id: 1,
  name: 'Bard',
  description: 'Masters of captivation.',
  cardType: 'class',
};

@Component({
  template: `<app-card-edit-preview [card]="card()" />`,
  imports: [CardEditPreview],
})
class HostComponent {
  card = signal<CardData | null>(null);
}

describe('CardEditPreview', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the preview title', () => {
    expect(el.querySelector('.preview-title')).toBeTruthy();
  });

  it('renders the LIVE pill', () => {
    const pill = el.querySelector('.preview-live-pill');
    expect(pill).toBeTruthy();
    expect(pill?.textContent?.trim()).toBe('LIVE');
  });

  describe('when card is null', () => {
    it('does not render the daggerheart card', () => {
      host.card.set(null);
      fixture.detectChanges();
      expect(el.querySelector('app-daggerheart-card')).toBeNull();
    });
  });

  describe('when card is provided', () => {
    beforeEach(() => {
      host.card.set(MOCK_CARD);
      fixture.detectChanges();
    });

    it('renders the daggerheart card component', () => {
      expect(el.querySelector('app-daggerheart-card')).toBeTruthy();
    });

    it('passes collapsibleFeatures as true to DaggerheartCard', () => {
      const cardDe = fixture.debugElement.query(By.css('app-daggerheart-card'));
      expect(cardDe?.componentInstance?.collapsibleFeatures()).toBe(true);
    });

    it('passes layout wide to DaggerheartCard', () => {
      const cardDe = fixture.debugElement.query(By.css('app-daggerheart-card'));
      expect(cardDe?.componentInstance?.layout()).toBe('wide');
    });
  });
});
