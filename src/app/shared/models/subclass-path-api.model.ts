export interface SubclassPathApiResponse {
  id: number;
  name: string;
  description?: string;
  associatedDomains?: { id: number; name: string }[];
  spellcastingTrait?: string;
}
