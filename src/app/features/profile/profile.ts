import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal, computed, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { UserResponse } from '../../core/models/auth.model';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { EncounterService } from '../../shared/services/encounter.service';
import { EncounterResponse } from '../../shared/models/encounter-api.model';
import { isAtLeast } from '../../shared/models/role.model';
import { CharacterSummary } from './models/profile.model';
import { mapToSummary } from './models/profile.mapper';
import { RosterList } from './components/roster-list/roster-list';
import { RosterPanel } from './components/roster-panel/roster-panel';
import { campaignToRosterItem, encounterToRosterItem } from './components/roster-panel/roster-panel.mapper';
import { ENCOUNTER_NEW_PATH, ENCOUNTERS_LIST_PATH, encounterEditPath } from '../encounters/encounter-routes';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RosterList, RosterPanel, RouterLink],
})
export class Profile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly campaignService = inject(CampaignService);
  private readonly encounterService = inject(EncounterService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly rosterList = viewChild(RosterList);
  private readonly campaignRoster = viewChild<RosterPanel>('campaignRosterPanel');
  private readonly encounterRoster = viewChild<RosterPanel>('encounterRosterPanel');

  readonly campaignsListPath = '/campaigns';
  readonly encountersListPath = ENCOUNTERS_LIST_PATH;

  readonly profileUser = signal<UserResponse | null>(null);
  readonly profileLoading = signal(true);
  readonly profileError = signal<'not-found' | 'unknown' | null>(null);
  readonly characters = signal<CharacterSummary[]>([]);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);
  readonly campaigns = signal<CampaignResponse[]>([]);
  readonly campaignsLoading = signal(true);
  readonly campaignsError = signal(false);
  readonly encounters = signal<EncounterResponse[]>([]);
  readonly encountersLoading = signal(true);
  readonly encountersError = signal(false);

  readonly campaignItems = computed(() => this.campaigns().map(campaignToRosterItem));
  readonly encounterItems = computed(() => this.encounters().map(encounterToRosterItem));

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

  /**
   * Stricter than `canViewCampaigns`: campaigns has a per-user server endpoint
   * (`getUserCampaigns`), so an admin viewing someone else's profile genuinely sees that user's
   * campaigns. Encounters has no such endpoint -- `EncounterService.getOwnEncounters` can only
   * answer "encounters the caller can see", which for anyone but the profile's own user silently
   * under-reports (misses that user's private encounters). Rather than show a near-empty panel
   * that looks like an empty roster, this is restricted to the profile's own user, even for
   * admins, until a real `/users/{id}/encounters` endpoint exists.
   */
  readonly canViewEncounters = computed(() => this.isOwnProfile());

  /**
   * An admin viewing someone else's profile sees Campaigns (real data, via the per-user
   * endpoint) but not Encounters (gated above) -- without an explanation, that looks identical
   * to "this user has none" rather than "this pass can't show them." Only relevant for that
   * admin-viewing-other case: a non-admin viewing another profile sees neither section, so
   * there's no visible asymmetry to explain there.
   */
  readonly showEncountersHiddenNote = computed(() => this.canViewCampaigns() && !this.isOwnProfile());

  readonly canDeleteItems = computed(() => {
    const current = this.authService.user();
    if (!current) return false;
    if (this.isOwnProfile()) return true;
    return isAtLeast(current.role, 'ADMIN');
  });

  readonly avatarError = signal(false);

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
        this.encountersLoading.set(false);
        return;
      }

      const currentUser = this.authService.user();
      if (currentUser?.id === id) {
        this.profileUser.set(currentUser);
        this.profileLoading.set(false);
        this.loadCharacters(id);
        this.loadCampaignsIfAllowed(id);
        this.loadEncountersIfAllowed(id);
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
      this.loadEncountersIfAllowed(currentUser.id);
    }
  }

  onAvatarError(): void {
    this.avatarError.set(true);
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

  onViewEncounter(id: number): void {
    this.router.navigate([encounterEditPath(id)]);
  }

  onCreateEncounter(): void {
    this.router.navigate([ENCOUNTER_NEW_PATH]);
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

  onDeleteEncounter(id: number): void {
    this.encounterService.deleteEncounter(id).subscribe({
      next: () => {
        this.encounters.update(encs => encs.filter(e => e.id !== id));
        this.encounterRoster()?.resetDeleteState();
      },
      error: () => {
        this.encounterRoster()?.resetDeleteState();
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
        this.loadEncountersIfAllowed(id);
      }
      this.profileLoading.set(false);
    });
  }

  private loadCharacters(ownerId: number): void {
    this.userService.getUserCharacterSheets(ownerId, 0, 100, 'subclassCards').pipe(
      map(response => response.content.map(sheet => mapToSummary(sheet))),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) {
          this.charactersError.set(true);
        }
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((response) => {
      if (response) {
        this.campaigns.set(response.content);
      }
      this.campaignsLoading.set(false);
    });
  }

  private loadEncountersIfAllowed(userId: number): void {
    if (!this.canViewEncounters()) {
      this.encountersLoading.set(false);
      return;
    }
    this.encounterService.getOwnEncounters(userId).pipe(
      catchError(() => {
        this.encountersError.set(true);
        return of([] as EncounterResponse[]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((encounters) => {
      this.encounters.set(encounters);
      this.encountersLoading.set(false);
    });
  }

}
