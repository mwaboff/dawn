import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SavingSpinner } from '../../../../shared/components/saving-spinner/saving-spinner';
import { CompanionPanel } from '../../../character-sheet/components/companion-panel/companion-panel';
import { CompanionFormModal } from '../../../character-sheet/components/companion-panel/components/companion-form-modal/companion-form-modal';
import { CompanionCardBeta } from './components/companion-card-beta/companion-card-beta';
import { CollapsibleCardGroup } from '../collapsible-card-group/collapsible-card-group';

/**
 * Beta rendering of {@link CompanionPanel}: same inherited create/edit/delete/stress-forwarding
 * logic and the same create/edit modal -- only the per-companion card swaps, to
 * `CompanionCardBeta`. `CompanionFormModal` renders in a dialog layer outside any card, so it's
 * reused unchanged rather than converted.
 */
@Component({
  selector: 'app-companion-panel-beta',
  templateUrl: './companion-panel-beta.html',
  styleUrl: './companion-panel-beta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner, CompanionCardBeta, CompanionFormModal, CollapsibleCardGroup],
})
export class CompanionPanelBeta extends CompanionPanel {}
