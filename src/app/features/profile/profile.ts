import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PaginatedResponse } from '../../shared/models/api.model';
import { CharacterSummary, ClassEntry } from './models/profile.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { environment } from '../../../environments/environment';
import { RosterList } from './components/roster-list/roster-list';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RosterList],
})
export class Profile implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly characters = signal<CharacterSummary[]>([]);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);

  readonly joinDate = computed(() => {
    const createdAt = this.user()?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (!userId) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadCharacters(userId);
  }

  onViewCharacter(id: number): void {
    this.router.navigate(['/character', id]);
  }

  onCreateCharacter(): void {
    this.router.navigate(['/create-character']);
  }

  private loadCharacters(ownerId: number): void {
    const params = new HttpParams()
      .set('ownerId', ownerId.toString())
      .set('size', '100')
      .set('expand', 'subclassCards');

    this.http
      .get<PaginatedResponse<CharacterSheetResponse>>(
        `${environment.apiUrl}/dh/character-sheets`,
        { params, withCredentials: true },
      )
      .pipe(
        map(response => ({
          ...response,
          content: response.content.map(sheet => this.mapToSummary(sheet)),
        })),
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 403) {
            this.charactersError.set(true);
          }
          return of(null);
        }),
      )
      .subscribe((response) => {
        if (response) {
          this.characters.set(response.content);
        }
        this.charactersLoading.set(false);
      });
  }

  private mapToSummary(sheet: CharacterSheetResponse): CharacterSummary {
    return {
      id: sheet.id,
      name: sheet.name,
      pronouns: sheet.pronouns,
      level: sheet.level,
      classEntries: this.extractClassEntries(sheet.subclassCards ?? []),
      createdAt: sheet.createdAt,
    };
  }

  private extractClassEntries(subclassCards: { associatedClassName?: string; subclassPathName?: string }[]): ClassEntry[] {
    const seen = new Map<string, ClassEntry>();
    for (const card of subclassCards) {
      const className = card.associatedClassName ?? 'Unknown';
      if (!seen.has(className)) {
        seen.set(className, { className, subclassName: card.subclassPathName });
      }
    }
    return Array.from(seen.values());
  }
}
