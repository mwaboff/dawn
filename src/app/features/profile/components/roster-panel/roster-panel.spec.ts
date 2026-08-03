import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RosterPanel } from './roster-panel';
import { RosterPanelItem } from './roster-panel.model';
import { InlineDeleteConfirm } from '../../../../shared/components/inline-delete-confirm/inline-delete-confirm';

function makeItem(overrides: Partial<RosterPanelItem> = {}): RosterPanelItem {
  return {
    id: 1,
    name: 'Dragon Slayers',
    metaPrimary: 'GM: dungeon_master',
    metaSecondary: '3 players',
    ...overrides,
  };
}

@Component({
  template: `
    <app-roster-panel
      [items]="items()"
      [loading]="loading()"
      [error]="error()"
      [showCreateButton]="showCreateButton()"
      [canDelete]="canDelete()"
      itemTypeLabel="Campaign"
      listLabel="Campaigns"
      listPath="/campaigns"
      createButtonLabel="Create Your First Campaign"
      emptyTextSelf="No adventures yet"
      emptyTextOther="No campaigns yet"
      errorText="Something went wrong loading your campaigns."
      (view)="viewedId = $event"
      (create)="createCalled = true"
      (delete)="deletedId = $event"
    />
  `,
  imports: [RosterPanel],
})
class TestHost {
  items = signal<RosterPanelItem[]>([]);
  loading = signal(false);
  error = signal(false);
  showCreateButton = signal(true);
  canDelete = signal(false);
  viewedId: number | null = null;
  deletedId: number | null = null;
  createCalled = false;
}

describe('RosterPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(el.querySelector('app-roster-panel')).toBeTruthy();
  });

  it('should show loading skeletons when loading is true', () => {
    host.loading.set(true);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-skeleton').length).toBe(2);
  });

  it('should show error message with the supplied errorText when error is true', () => {
    host.error.set(true);
    fixture.detectChanges();

    expect(el.querySelector('.roster-message')?.textContent?.trim())
      .toBe('Something went wrong loading your campaigns.');
  });

  it('should show emptyTextSelf when empty and showCreateButton is true', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty-text')?.textContent?.trim()).toBe('No adventures yet');
  });

  it('should show emptyTextOther when empty and showCreateButton is false', () => {
    host.showCreateButton.set(false);
    fixture.detectChanges();

    expect(el.querySelector('.roster-empty-text')?.textContent?.trim()).toBe('No campaigns yet');
  });

  it('should emit create when the create button is clicked', () => {
    fixture.detectChanges();
    const btn = el.querySelector('.roster-create-btn') as HTMLButtonElement;
    btn.click();

    expect(host.createCalled).toBe(true);
  });

  it('should render one entry per item', () => {
    host.items.set([makeItem({ id: 1 }), makeItem({ id: 2 })]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.roster-entry').length).toBe(2);
  });

  it('should display name, metaPrimary, and metaSecondary', () => {
    host.items.set([makeItem({ name: 'The Lost Mines', metaPrimary: 'GM: Elara', metaSecondary: '5 players' })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-character-name')?.textContent?.trim()).toBe('The Lost Mines');
    expect(el.querySelector('.roster-class-name')?.textContent?.trim()).toBe('GM: Elara');
    expect(el.querySelector('.roster-class-subclass')?.textContent?.trim()).toBe('5 players');
  });

  it('should show a badge when one is set', () => {
    host.items.set([makeItem({ badge: 'Ended' })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-badge')?.textContent?.trim()).toBe('Ended');
  });

  it('should not show a badge when none is set', () => {
    host.items.set([makeItem({ badge: undefined })]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-badge')).toBeFalsy();
  });

  it('should emit view with the item id when an entry is clicked', () => {
    host.items.set([makeItem({ id: 42 })]);
    fixture.detectChanges();
    (el.querySelector('.roster-entry') as HTMLElement).click();

    expect(host.viewedId).toBe(42);
  });

  it('should show "View All {listLabel}" linking to listPath when items exist', () => {
    host.items.set([makeItem()]);
    fixture.detectChanges();

    const link = el.querySelector('.roster-add-link') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('View All Campaigns');
    expect(link.getAttribute('href')).toBe('/campaigns');
  });

  it('should still show "View All {listLabel}" when the list is empty but showCreateButton is true', () => {
    fixture.detectChanges();

    expect(el.querySelector('.roster-add-link')?.textContent?.trim()).toBe('View All Campaigns');
  });

  it('should not show "View All {listLabel}" when showCreateButton is false, even with items', () => {
    host.showCreateButton.set(false);
    host.items.set([makeItem()]);
    fixture.detectChanges();

    expect(el.querySelector('.roster-add-link')).toBeFalsy();
  });

  describe('delete functionality', () => {
    it('should not show inline-delete-confirm when canDelete is false', () => {
      host.items.set([makeItem()]);
      fixture.detectChanges();

      expect(el.querySelector('app-inline-delete-confirm')).toBeFalsy();
    });

    it('should render inline-delete-confirm when canDelete is true', () => {
      host.canDelete.set(true);
      host.items.set([makeItem()]);
      fixture.detectChanges();

      expect(el.querySelector('app-inline-delete-confirm')).toBeTruthy();
    });

    it('should pass the item name as itemLabel to inline-delete-confirm', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ name: 'Dragon Slayers' })]);
      fixture.detectChanges();

      const child = fixture.debugElement.query(By.directive(InlineDeleteConfirm));
      expect(child.componentInstance.itemLabel()).toBe('Dragon Slayers');
    });

    it('should show the confirm dialog titled "Delete {itemTypeLabel}" when child emits confirmed', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ id: 42 })]);
      fixture.detectChanges();

      const child = fixture.debugElement.query(By.directive(InlineDeleteConfirm));
      child.componentInstance.requested.emit();
      fixture.detectChanges();
      child.componentInstance.confirmed.emit();
      fixture.detectChanges();

      expect(el.querySelector('.dialog-title')?.textContent?.trim()).toBe('Delete Campaign');
    });

    it('should reset pendingDeleteId when child emits cancelled', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ id: 42 })]);
      fixture.detectChanges();

      const rosterPanel = fixture.debugElement.query(By.directive(RosterPanel)).componentInstance as RosterPanel;
      const child = fixture.debugElement.query(By.directive(InlineDeleteConfirm));
      child.componentInstance.requested.emit();
      fixture.detectChanges();
      child.componentInstance.cancelled.emit();
      fixture.detectChanges();

      expect(rosterPanel.pendingDeleteId()).toBeNull();
    });

    it('should emit delete on modal confirm', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ id: 42 })]);
      fixture.detectChanges();

      const child = fixture.debugElement.query(By.directive(InlineDeleteConfirm));
      child.componentInstance.requested.emit();
      fixture.detectChanges();
      child.componentInstance.confirmed.emit();
      fixture.detectChanges();

      (el.querySelector('.dialog-btn--confirm') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(host.deletedId).toBe(42);
    });

    it('should hide the dialog on modal cancel', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ id: 42 })]);
      fixture.detectChanges();

      const child = fixture.debugElement.query(By.directive(InlineDeleteConfirm));
      child.componentInstance.requested.emit();
      fixture.detectChanges();
      child.componentInstance.confirmed.emit();
      fixture.detectChanges();
      expect(el.querySelector('app-confirm-dialog')).toBeTruthy();

      (el.querySelector('.dialog-btn--cancel') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.querySelector('app-confirm-dialog')).toBeFalsy();
    });

    it('should reset delete state via resetDeleteState()', () => {
      host.canDelete.set(true);
      host.items.set([makeItem({ id: 42 })]);
      fixture.detectChanges();

      const rosterPanel = fixture.debugElement.query(By.directive(RosterPanel)).componentInstance as RosterPanel;
      rosterPanel.onDeleteRequest(42);
      rosterPanel.onDeleteConfirm();
      rosterPanel.resetDeleteState();

      expect(rosterPanel.pendingDeleteId()).toBeNull();
      expect(rosterPanel.confirmingDeleteId()).toBeNull();
      expect(rosterPanel.deletingId()).toBeNull();
    });
  });
});
