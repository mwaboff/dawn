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
}
