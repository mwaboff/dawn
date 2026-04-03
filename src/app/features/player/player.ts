import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserResponse } from '../../core/models/auth.model';
import { UserService } from '../../shared/services/user.service';
import { CharacterSummary, ClassEntry } from '../profile/models/profile.model';
import { RosterList } from '../profile/components/roster-list/roster-list';

@Component({
  selector: 'app-player',
  templateUrl: './player.html',
  styleUrl: './player.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RosterList, RouterLink],
})
export class Player implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly player = signal<UserResponse | null>(null);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly playerLoading = signal(true);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);
  readonly error = signal<'not-found' | 'unknown' | null>(null);

  readonly joinDate = computed(() => {
    const createdAt = this.player()?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error.set('not-found');
      this.playerLoading.set(false);
      this.charactersLoading.set(false);
      return;
    }

    const currentUser = this.authService.user();
    if (currentUser && currentUser.id === id) {
      this.router.navigate(['/profile']);
      return;
    }

    this.loadPlayer(id);
    this.loadCharacters(id);
  }

  onViewCharacter(id: number): void {
    this.router.navigate(['/character', id]);
  }

  private loadPlayer(id: number): void {
    this.userService.getUser(id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.error.set('not-found');
        } else {
          this.error.set('unknown');
        }
        return of(null);
      }),
    ).subscribe((user) => {
      if (user) {
        this.player.set(user);
      }
      this.playerLoading.set(false);
    });
  }

  private loadCharacters(ownerId: number): void {
    this.userService.getUserCharacterSheets(ownerId, 0, 100, 'subclassCards').pipe(
      map(response => response.content.map(sheet => this.mapToSummary(sheet))),
      catchError(() => {
        this.charactersError.set(true);
        return of([]);
      }),
    ).subscribe((characters) => {
      this.characters.set(characters);
      this.charactersLoading.set(false);
    });
  }

  private mapToSummary(sheet: { id: number; name: string; pronouns?: string; level: number; subclassCards?: { associatedClassName?: string; subclassPathName?: string }[]; createdAt: string }): CharacterSummary {
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
