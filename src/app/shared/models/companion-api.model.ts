export interface CompanionApiResponse {
  id: number;
  characterSheetId: number;
  name: string;
  description?: string;
  evasion: number;
  attackName: string;
  attackRange: string;
  damageDice: string;
  stressMax: number;
  stressMarked: number;
  createdAt: string;
  lastModifiedAt: string;
}
