import { CardData } from '../components/daggerheart-card/daggerheart-card.model';

export interface PaginatedResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedCards {
  cards: CardData[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}
