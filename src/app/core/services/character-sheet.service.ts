import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CharacterSheetResponse,
  CreateCharacterSheetRequest,
  UpdateCharacterSheetRequest,
  CreateExperienceRequest,
  ExperienceResponse,
} from '../../features/create-character/models/character-sheet-api.model';
import { LevelUpOptionsResponse, LevelUpRequest, LevelUpResponse } from '../../features/level-up/models/level-up-api.model';

@Injectable({ providedIn: 'root' })
export class CharacterSheetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/character-sheets`;

  createCharacterSheet(request: CreateCharacterSheetRequest): Observable<CharacterSheetResponse> {
    return this.http.post<CharacterSheetResponse>(this.baseUrl, request, {
      withCredentials: true,
    });
  }

  createExperience(request: CreateExperienceRequest): Observable<ExperienceResponse> {
    return this.http.post<ExperienceResponse>(
      `${environment.apiUrl}/dh/experiences`,
      request,
      { withCredentials: true },
    );
  }

  getCharacterSheet(id: number, expand?: string[]): Observable<CharacterSheetResponse> {
    let params = new HttpParams();
    if (expand?.length) {
      params = params.set('expand', expand.join(','));
    }
    return this.http.get<CharacterSheetResponse>(`${this.baseUrl}/${id}`, {
      params,
      withCredentials: true,
    });
  }

  getLevelUpOptions(id: number): Observable<LevelUpOptionsResponse> {
    return this.http.get<LevelUpOptionsResponse>(`${this.baseUrl}/${id}/level-up-options`, {
      withCredentials: true,
    });
  }

  levelUp(id: number, request: LevelUpRequest): Observable<LevelUpResponse> {
    return this.http.post<LevelUpResponse>(`${this.baseUrl}/${id}/level-up`, request, {
      withCredentials: true,
    });
  }

  updateCharacterSheet(id: number, request: UpdateCharacterSheetRequest): Observable<CharacterSheetResponse> {
    return this.http.put<CharacterSheetResponse>(`${this.baseUrl}/${id}`, request, {
      withCredentials: true,
    });
  }

  undoLevelUp(id: number): Observable<CharacterSheetResponse> {
    return this.http.delete<CharacterSheetResponse>(`${this.baseUrl}/${id}/level-up`, {
      withCredentials: true,
    });
  }
}
