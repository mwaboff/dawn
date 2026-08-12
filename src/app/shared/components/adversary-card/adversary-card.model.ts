import { CardFeature } from '../daggerheart-card/daggerheart-card.model';

export interface AdversaryData {
  id: number;
  name: string;
  description?: string;
  /** Absent only on a `restricted` stub -- `AdversaryCard` never reads this when `restricted` is
   * true, so it is left off rather than filled with a placeholder `0` that could read as fact. */
  tier?: number;
  /** See `tier`. Absent, not `''`, on a `restricted` stub. */
  adversaryType?: string;
  difficulty?: number;
  hitPointMax?: number;
  stressMax?: number;
  evasion?: number;
  majorThreshold?: number;
  severeThreshold?: number;
  attackModifier?: number;
  weaponName?: string;
  attackRange?: string;
  damage?: { notation: string; damageType: string };
  motivesAndTactics?: string;
  expansionId?: number;
  features?: CardFeature[];
  /** GM spends a Fear to add `modifier` to a roll -- printed on the card as e.g. "Thief +2". */
  experiences?: { description: string; modifier: number }[];
  /** Whether this adversary is SRD-licensed content, freely usable without owning the
   * sourcebook it belongs to. Sent on every response regardless of `restricted`. */
  srd?: boolean;
  /** Present only when the backend redacted this adversary because the viewer lacks access to
   * its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `adversary.mapper.ts`'s `mapAdversaryToAdversaryData` and
   * `adversary-data-to-entity-card.mapper.ts`'s `adversaryToEntityCard`. */
  restricted?: boolean;
  /** The paid book this adversary belongs to, present only alongside `restricted: true` and only
   * when the backend knows it. */
  expansionName?: string;
}
