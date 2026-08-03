import { AdversaryData } from '../../../../shared/components/adversary-card/adversary-card.model';

/**
 * One adversary instance in the roster being assembled, whether it already exists on the saved
 * encounter or was just added in this editing session. `localId` is what every roster/meter
 * interaction keys off of -- it's stable across a save (existing instances keep their server
 * `id` as `localId`) but also works for a brand-new instance that has no server id yet.
 */
export interface EncounterRosterInstance {
  localId: string;
  adversaryId: number;
  adversary: AdversaryData;
  label?: string;
  tierOverride?: number;
  displayOrder: number;
}
