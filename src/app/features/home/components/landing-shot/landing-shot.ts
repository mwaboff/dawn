import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { LandingShot as LandingShotData } from '../../landing.model';

@Component({
  selector: 'app-landing-shot',
  templateUrl: './landing-shot.html',
  styleUrl: './landing-shot.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class LandingShot {
  readonly shot = input.required<LandingShotData>();
  /** Above-the-fold images load eagerly with high fetch priority. */
  readonly priority = input(false);
}
