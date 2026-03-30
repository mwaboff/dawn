import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminCardService {
  private readonly http = inject(HttpClient);

  private readonly ENDPOINT_MAP: Record<string, string> = {
    'class': '/dh/classes',
    'subclass': '/dh/cards/subclass',
    'ancestry': '/dh/cards/ancestry',
    'community': '/dh/cards/community',
    'domain': '/dh/domains',
    'domainCard': '/dh/cards/domain',
    'weapon': '/dh/weapons',
    'armor': '/dh/armors',
    'loot': '/dh/loot',
    'companion': '/dh/companions',
    'subclassPath': '/dh/subclass-paths',
    'adversary': '/dh/adversaries',
    'feature': '/dh/features',
  };

  private getEndpoint(cardType: string): string {
    const endpoint = this.ENDPOINT_MAP[cardType];
    if (!endpoint) throw new Error(`Unknown card type: ${cardType}`);
    return `${environment.apiUrl}${endpoint}`;
  }

  getCard(cardType: string, id: number, expand?: string): Observable<unknown> {
    let params = new HttpParams();
    if (expand) {
      params = params.set('expand', expand);
    }
    return this.http.get(`${this.getEndpoint(cardType)}/${id}`, {
      params,
      withCredentials: true,
    });
  }

  updateCard(cardType: string, id: number, body: unknown): Observable<unknown> {
    return this.http.put(`${this.getEndpoint(cardType)}/${id}`, body, {
      withCredentials: true,
    });
  }

  bulkCreate(cardType: string, body: unknown[]): Observable<unknown> {
    return this.http.post(`${this.getEndpoint(cardType)}/bulk`, body, {
      withCredentials: true,
    });
  }

  deleteCard(cardType: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.getEndpoint(cardType)}/${id}`, {
      withCredentials: true,
    });
  }

  restoreCard(cardType: string, id: number): Observable<unknown> {
    return this.http.post(`${this.getEndpoint(cardType)}/${id}/restore`, {}, {
      withCredentials: true,
    });
  }
}
