import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse } from '../../core/models/auth.model';
import { PaginatedResponse } from '../models/api.model';
import { CharacterSheetResponse } from '../../features/create-character/models/character-sheet-api.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getUser(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/users/${id}`,
      { withCredentials: true },
    );
  }

  getUserCharacterSheets(
    ownerId: number,
    page = 0,
    size = 20,
    expand?: string,
  ): Observable<PaginatedResponse<CharacterSheetResponse>> {
    let params = new HttpParams()
      .set('ownerId', ownerId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (expand) {
      params = params.set('expand', expand);
    }

    return this.http.get<PaginatedResponse<CharacterSheetResponse>>(
      `${environment.apiUrl}/dh/character-sheets`,
      { params, withCredentials: true },
    );
  }
}
