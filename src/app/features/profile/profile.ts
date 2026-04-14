import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { UserResponse } from '../../core/models/auth.model';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { isAtLeast } from '../../shared/models/role.model';
import { CharacterSummary, ClassEntry } from './models/profile.model';
import { RosterList } from './components/roster-list/roster-list';
import { CampaignRoster } from './components/campaign-roster/campaign-roster';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RosterList, CampaignRoster, RouterLink],
})
export class Profile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly campaignService = inject(CampaignService);

  private readonly rosterList = viewChild(RosterList);
  private readonly campaignRoster = viewChild(CampaignRoster);

  readonly profileUser = signal<UserResponse | null>(null);
  readonly profileLoading = signal(true);
  readonly profileError = signal<'not-found' | 'unknown' | null>(null);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);
  readonly campaigns = signal<CampaignResponse[]>([]);
  readonly campaignsLoading = signal(true);
  readonly campaignsError = signal(false);
  readonly isOwnProfile = computed(() => {
    const current = this.authService.user();
    const viewed = this.profileUser();
    return !!(current && viewed && current.id === viewed.id);
  });

  readonly canViewCampaigns = computed(() => {
    const current = this.authService.user();
    if (!current) return false;
    if (this.isOwnProfile()) return true;
    return isAtLeast(current.role, 'ADMIN');
  });

  readonly canDeleteItems = computed(() => {
    const current = this.authService.user();
    if (!current) return false;
    if (this.isOwnProfile()) return true;
    return isAtLeast(current.role, 'ADMIN');
  });

  readonly joinDate = computed(() => {
    const createdAt = this.profileUser()?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      if (isNaN(id)) {
        this.profileError.set('not-found');
        this.profileLoading.set(false);
        this.charactersLoading.set(false);
        this.campaignsLoading.set(false);
        return;
      }

      const currentUser = this.authService.user();
      if (currentUser?.id === id) {
        this.profileUser.set(currentUser);
        this.profileLoading.set(false);
        this.loadCharacters(id);
        this.loadCampaignsIfAllowed(id);
      } else {
        this.loadProfileUser(id);
        this.loadCharacters(id);
      }
    } else {
      const currentUser = this.authService.user();
      if (!currentUser) {
        this.router.navigate(['/auth']);
        return;
      }
      this.profileUser.set(currentUser);
      this.profileLoading.set(false);
      this.loadCharacters(currentUser.id);
      this.loadCampaignsIfAllowed(currentUser.id);
    }
  }

  onViewCharacter(id: number): void {
    this.router.navigate(['/character', id]);
  }

  onCreateCharacter(): void {
    this.router.navigate(['/create-character']);
  }

  onViewCampaign(id: number): void {
    this.router.navigate(['/campaign', id]);
  }

  onCreateCampaign(): void {
    this.router.navigate(['/campaigns/create']);
  }

  onDeleteCharacter(id: number): void {
    this.characterSheetService.deleteCharacterSheet(id).subscribe({
      next: () => {
        this.characters.update(chars => chars.filter(c => c.id !== id));
        this.rosterList()?.resetDeleteState();
      },
      error: () => {
        this.rosterList()?.resetDeleteState();
      },
    });
  }

  onDeleteCampaign(id: number): void {
    this.campaignService.deleteCampaign(id).subscribe({
      next: () => {
        this.campaigns.update(camps => camps.filter(c => c.id !== id));
        this.campaignRoster()?.resetDeleteState();
      },
      error: () => {
        this.campaignRoster()?.resetDeleteState();
      },
    });
  }

  private loadProfileUser(id: number): void {
    this.userService.getUser(id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.profileError.set('not-found');
        } else {
          this.profileError.set('unknown');
        }
        return of(null);
      }),
    ).subscribe((user) => {
      if (user) {
        this.profileUser.set(user);
        this.loadCampaignsIfAllowed(id);
      }
      this.profileLoading.set(false);
    });
  }

  private loadCharacters(ownerId: number): void {
    this.userService.getUserCharacterSheets(ownerId, 0, 100, 'subclassCards').pipe(
      map(response => response.content.map(sheet => this.mapToSummary(sheet))),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) {
          this.charactersError.set(true);
        }
        return of([]);
      }),
    ).subscribe((characters) => {
      this.characters.set(characters);
      this.charactersLoading.set(false);
    });
  }

  private loadCampaignsIfAllowed(userId: number): void {
    if (!this.canViewCampaigns()) {
      this.campaignsLoading.set(false);
      return;
    }
    this.userService.getUserCampaigns(userId, 0, 50, 'creator').pipe(
      catchError(() => {
        this.campaignsError.set(true);
        return of(null);
      }),
    ).subscribe((response) => {
      if (response) {
        this.campaigns.set(response.content);
      }
      this.campaignsLoading.set(false);
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
