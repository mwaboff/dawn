export interface ExpansionApiResponse {
  id: number;
  name: string;
}

export interface ExpansionOption {
  id: number;
  name: string;
}

export interface CreateExpansionRequest {
  name: string;
  isPublished: boolean;
}
