import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../models/profile.model';

@Component({
  selector: 'app-roster-list',
  templateUrl: './roster-list.html',
  styleUrl: './roster-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class RosterList {
  readonly characters = input.required<CharacterSummary[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();

  readonly viewCharacter = output<number>();
  readonly createCharacter = output<void>();
}
