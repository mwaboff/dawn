import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PaginatedResponse } from '../../shared/models/api.model';
import { CharacterSummary } from './models/profile.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
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

  readonly hasCharacters = computed(() => this.characters().length > 0);

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
      .set('size', '100');

    this.http
      .get<PaginatedResponse<CharacterSummary>>(
        `${environment.apiUrl}/dh/character-sheets`,
        { params, withCredentials: true },
      )
      .pipe(
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
}
