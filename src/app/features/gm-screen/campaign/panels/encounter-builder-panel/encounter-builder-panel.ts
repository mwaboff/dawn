import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-encounter-builder-panel',
  templateUrl: './encounter-builder-panel.html',
  styleUrl: './encounter-builder-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterBuilderPanel {}
