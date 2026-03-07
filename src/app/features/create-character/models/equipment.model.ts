import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';

export type EquipmentSubStep = 'weapon' | 'armor';

export interface EquipmentSelections {
  primaryWeapon: CardData | null;
  secondaryWeapon: CardData | null;
  armor: CardData | null;
}

export const INITIAL_EQUIPMENT: EquipmentSelections = {
  primaryWeapon: null,
  secondaryWeapon: null,
  armor: null,
};

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

