export interface SubclassPathApiResponse {
  id: number;
  name: string;
  associatedClassId: number;
  associatedClass?: {
    id: number;
    name: string;
    description?: string;
  };
  spellcastingTrait?: {
    trait: string;
    description: string;
    examples: string;
  };
  associatedDomainIds?: number[];
  associatedDomains?: { id: number; name: string }[];
  expansionId: number;
  expansion?: {
    id: number;
    name: string;
    isPublished: boolean;
  };
  createdAt: string;
  lastModifiedAt: string;
  /** Present only when the backend redacted this subclass path because the viewer lacks access
   * to its expansion (SRD vs. paid-expansion content gating); every other field except `id` may
   * then be omitted. See `subclass-path.mapper.ts`'s `mapSubclassPathToCardData`. */
  restricted?: boolean;
  /** The paid book this subclass path belongs to, present only alongside `restricted: true` and
   * only when the backend knows it. */
  expansionName?: string;
}
