import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export type SubclassLevel = 'FOUNDATION' | 'SPECIALIZATION' | 'MASTERY';

export interface SpellcastingTraitResponse {
  trait: string;
  description: string;
  examples: string;
}

export interface SubclassCostTag {
  id: number;
  label: string;
  category: string;
}

export interface SubclassFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: SubclassCostTag[];
  modifiers?: ModifierResponse[];
}

export interface SubclassCardResponse {
  id: number;
  name: string;
  description?: string;
  cardType: 'SUBCLASS';
  expansionId: number;
  expansionName?: string;
  isOfficial: boolean;
  featureIds: number[];
  features: SubclassFeatureResponse[];
  costTagIds: number[];
  costTags: SubclassCostTag[];
  subclassPathId: number;
  subclassPathName?: string;
  associatedClassId?: number;
  associatedClassName?: string;
  domainNames?: string[];
  level: SubclassLevel;
  spellcastingTrait?: SpellcastingTraitResponse | null;
  createdAt: string;
  lastModifiedAt: string;
  /** Whether this subclass card is SRD-licensed content, freely usable without owning the
   * sourcebook it belongs to. Sent on every response regardless of `restricted` -- and derived
   * from the subclass path's own flag, never set independently per card (see
   * `AdminContentService#applySrd` on the backend). */
  srd?: boolean;
  /** Present only when the backend redacted this subclass because the viewer lacks access to its
   * expansion (SRD vs. paid-expansion content gating); every other field except `id` and
   * `expansionName` (already declared above) may then be omitted. See `subclass.mapper.ts`'s
   * `mapSubclassResponseToCardData`. */
  restricted?: boolean;
}
