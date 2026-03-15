import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-saving-spinner',
  templateUrl: './saving-spinner.html',
  styleUrl: './saving-spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-label': 'Saving changes' },
})
export class SavingSpinner {}
