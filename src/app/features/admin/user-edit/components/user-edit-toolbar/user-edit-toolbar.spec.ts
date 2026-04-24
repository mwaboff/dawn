import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { UserEditToolbar } from './user-edit-toolbar';

describe('UserEditToolbar', () => {
  let component: UserEditToolbar;
  let fixture: ComponentFixture<UserEditToolbar>;
  let componentRef: ComponentRef<UserEditToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UserEditToolbar] }).compileComponents();
    fixture = TestBed.createComponent(UserEditToolbar);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('banned', false);
    fixture.detectChanges();
  });

  it('progresses ban flow: pending → confirming → emit reason', () => {
    const banSpy = vi.fn();
    component.ban.subscribe(banSpy);

    component.onBanClick();
    expect(component.pendingBan()).toBe(true);
    expect(component.confirmingBan()).toBe(false);

    component.reasonCtrl.setValue('  spam ');
    component.onInlineConfirm();
    expect(component.confirmingBan()).toBe(true);

    component.onConfirmBan();
    expect(banSpy).toHaveBeenCalledWith('spam');
  });

  it('cancels ban flow and clears reason', () => {
    component.onBanClick();
    component.reasonCtrl.setValue('x');
    component.onInlineConfirm();
    component.onCancelBan();
    expect(component.pendingBan()).toBe(false);
    expect(component.confirmingBan()).toBe(false);
    expect(component.reasonCtrl.value).toBe('');
  });

  it('shows unban dialog and emits unban', () => {
    const unbanSpy = vi.fn();
    component.unban.subscribe(unbanSpy);
    componentRef.setInput('banned', true);
    fixture.detectChanges();

    component.onUnbanClick();
    expect(component.confirmingUnban()).toBe(true);
    component.onConfirmUnban();
    expect(unbanSpy).toHaveBeenCalled();
  });

  it('emits save event', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);
    component.onSave();
    expect(saveSpy).toHaveBeenCalled();
  });
});
