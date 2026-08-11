import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { CardEditPreview } from './card-edit-preview';
import { EntityCardData } from '../../../../../shared/components/entity-card/entity-card.model';

const MOCK_CARD: EntityCardData = {
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
  card = signal<EntityCardData | null>(null);
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
    it('does not render a card', () => {
      host.card.set(null);
      fixture.detectChanges();
      expect(el.querySelector('app-entity-card')).toBeNull();
    });
  });

  describe('when card is provided', () => {
    beforeEach(() => {
      host.card.set(MOCK_CARD);
      fixture.detectChanges();
    });

    it('renders the shared EntityCard, the face the rest of the site uses', () => {
      expect(el.querySelector('app-entity-card')).toBeTruthy();
    });

    it('renders it expanded, so the body is not clipped behind a toggle while editing', () => {
      const cardDe = fixture.debugElement.query(By.css('app-entity-card'));
      expect(cardDe?.componentInstance?.size()).toBe('expanded');
    });

    it('passes the card straight through', () => {
      const cardDe = fixture.debugElement.query(By.css('app-entity-card'));
      expect(cardDe?.componentInstance?.card()).toEqual(MOCK_CARD);
    });
  });
});
