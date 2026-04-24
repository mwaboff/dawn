import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-edit-toolbar',
  templateUrl: './user-edit-toolbar.html',
  styleUrl: './user-edit-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ConfirmDialog],
})
export class UserEditToolbar {
  readonly hasPendingChanges = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly processing = input<boolean>(false);
  readonly banned = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly saveSuccess = input<boolean>(false);

  readonly back = output<void>();
  readonly save = output<void>();
  readonly ban = output<string>();
  readonly unban = output<void>();

  readonly reasonCtrl = new FormControl<string>('', { nonNullable: true });

  readonly pendingBan = signal(false);
  readonly confirmingBan = signal(false);
  readonly confirmingUnban = signal(false);

  onBack(): void { this.back.emit(); }
  onSave(): void { this.save.emit(); }

  onBanClick(): void { this.pendingBan.set(true); }
  onInlineConfirm(): void { this.confirmingBan.set(true); }
  onInlineCancel(): void { this.pendingBan.set(false); }

  onConfirmBan(): void {
    const reason = this.reasonCtrl.value.trim();
    this.confirmingBan.set(false);
    this.pendingBan.set(false);
    this.reasonCtrl.reset('');
    this.ban.emit(reason);
  }

  onCancelBan(): void {
    this.confirmingBan.set(false);
    this.pendingBan.set(false);
    this.reasonCtrl.reset('');
  }

  onUnbanClick(): void { this.confirmingUnban.set(true); }

  onConfirmUnban(): void {
    this.confirmingUnban.set(false);
    this.unban.emit();
  }

  onCancelUnban(): void { this.confirmingUnban.set(false); }

  resetBanState(): void {
    this.pendingBan.set(false);
    this.confirmingBan.set(false);
    this.confirmingUnban.set(false);
    this.reasonCtrl.reset('');
  }
}
