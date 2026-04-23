import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TavernScrollVariant } from './variants/tavern-scroll/tavern-scroll';

@Component({
  selector: 'app-dice-roller',
  imports: [TavernScrollVariant],
  templateUrl: './dice-roller.html',
  styleUrl: './dice-roller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceRoller {}
