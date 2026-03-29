import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, EMPTY, switchMap, debounceTime, tap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { SavingSpinner } from '../../shared/components/saving-spinner/saving-spinner';
import { FormatTextPipe } from '../../shared/pipes/format-text.pipe';
import { mapToCharacterSheetView } from './utils/character-sheet-view.mapper';
import { CharacterSheetView, TRAIT_SUBSKILLS } from './models/character-sheet-view.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';

@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrls: ['./character-sheet.css', './character-sheet-layout.css', './character-sheet-panels.css', './character-sheet-equipment.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner, RouterLink, FormatTextPipe],
})
export class CharacterSheet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  private readonly rawSheet = signal<CharacterSheetResponse | null>(null);
  private readonly expandedCardIds = signal<Set<number>>(new Set());

  private readonly localHpMarked = signal<number | null>(null);
  private readonly localStressMarked = signal<number | null>(null);
  private readonly localHopeMarked = signal<number | null>(null);
  private readonly localArmorMarked = signal<number | null>(null);
  private readonly localGoldAdjustment = signal(0);
  readonly activeInventoryTab = signal<'weapons' | 'armor' | 'loot'>('weapons');
  private readonly swapInFlight = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly healthSave$ = new Subject<void>();
  private readonly hopeStressSave$ = new Subject<void>();
  private readonly goldSave$ = new Subject<void>();

  private readonly savingSections = signal<Set<string>>(new Set());
  readonly isSavingHealth = computed(() => this.savingSections().has('health'));
  readonly isSavingHopeStress = computed(() => this.savingSections().has('hopeStress'));
  readonly isSavingGold = computed(() => this.savingSections().has('gold'));

  readonly markedHp = computed(() => this.localHpMarked() ?? (this.characterSheet()?.hitPointMarked ?? 0));
  readonly markedStress = computed(() => this.localStressMarked() ?? (this.characterSheet()?.stressMarked ?? 0));
  readonly markedHope = computed(() => this.localHopeMarked() ?? (this.characterSheet()?.hopeMarked ?? 0));
  readonly markedArmor = computed(() => this.localArmorMarked() ?? (this.characterSheet()?.armorMarked ?? 0));
  readonly currentGold = computed(() => (this.characterSheet()?.gold ?? 0) + this.localGoldAdjustment());

  readonly isOwner = computed(() => {
    const sheet = this.characterSheet();
    const user = this.authService.user();
    return sheet !== null && user !== null && sheet.ownerId === user.id;
  });

  readonly canLevelUp = computed(() => {
    const sheet = this.characterSheet();
    return this.isOwner() && sheet !== null && sheet.level < 10;
  });

  readonly canLevelDown = computed(() => {
    const sheet = this.characterSheet();
    return this.isOwner() && sheet !== null && sheet.level >= 10;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.loadCharacterSheet(id);
    this.initSavePipelines();
  }

  private loadCharacterSheet(id: number): void {
    const expandFields = [
      'experiences',
      'communityCards',
      'ancestryCards',
      'subclassCards',
      'domainCards',
      'inventoryWeapons',
      'inventoryArmors',
      'inventoryItems',
      'features',
      'costTags',
      'modifiers',
    ];

    this.characterSheetService
      .getCharacterSheet(id, expandFields)
      .subscribe({
        next: (response) => {
          this.rawSheet.set(response);
          this.characterSheet.set(mapToCharacterSheetView(response));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  toggleResourceBox(resource: 'hp' | 'stress' | 'hope' | 'armor', index: number): void {
    const current = { hp: this.markedHp, stress: this.markedStress, hope: this.markedHope, armor: this.markedArmor }[resource]();
    const newValue = current === index ? index - 1 : index;
    switch (resource) {
      case 'hp': this.localHpMarked.set(newValue); break;
      case 'stress': this.localStressMarked.set(newValue); break;
      case 'hope': this.localHopeMarked.set(newValue); break;
      case 'armor': this.localArmorMarked.set(newValue); break;
    }
    if (resource === 'hp' || resource === 'armor') {
      this.healthSave$.next();
    } else {
      this.hopeStressSave$.next();
    }
  }

  formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  toggleCard(id: number): void {
    this.expandedCardIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isCardExpanded(id: number): boolean {
    return this.expandedCardIds().has(id);
  }

  getRange(max: number): number[] {
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getSubSkills(traitName: string): string[] {
    return TRAIT_SUBSKILLS[traitName] ?? [];
  }

  adjustGold(amount: number): void {
    this.localGoldAdjustment.update(current => current + amount);
    this.goldSave$.next();
  }

  selectInventoryTab(tab: 'weapons' | 'armor' | 'loot'): void {
    this.activeInventoryTab.set(tab);
  }

  canEquipCard(): boolean {
    const sheet = this.characterSheet();
    return sheet !== null && sheet.equippedDomainCards.length < sheet.maxEquippedDomainCards;
  }

  onVaultCard(cardId: number): void {
    this.swapDomainCard(cardId, 'to-vault');
  }

  onEquipCard(cardId: number): void {
    this.swapDomainCard(cardId, 'to-equipped');
  }

  isWeaponEquipped(weaponId: number): 'primary' | 'secondary' | null {
    const raw = this.rawSheet();
    if (!raw) return null;
    const entry = (raw.inventoryWeapons ?? []).find(w => w.weaponId === weaponId && w.equipped);
    if (!entry) return null;
    return entry.slot === 'PRIMARY' ? 'primary' : 'secondary';
  }

  isArmorEquipped(armorId: number): boolean {
    const raw = this.rawSheet();
    if (!raw) return false;
    return (raw.inventoryArmors ?? []).some(a => a.armorId === armorId && a.equipped);
  }

  canEquipPrimaryWeapon(): boolean {
    const raw = this.rawSheet();
    if (!raw) return false;
    return !(raw.inventoryWeapons ?? []).some(w => w.slot === 'PRIMARY');
  }

  canEquipSecondaryWeapon(): boolean {
    const raw = this.rawSheet();
    if (!raw) return false;
    return !(raw.inventoryWeapons ?? []).some(w => w.slot === 'SECONDARY');
  }

  canEquipArmor(): boolean {
    const raw = this.rawSheet();
    if (!raw) return false;
    return !(raw.inventoryArmors ?? []).some(a => a.equipped);
  }

  onEquipWeapon(weaponId: number, slot: 'primary' | 'secondary'): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    if (this.isWeaponEquipped(weaponId)) return;

    const apiSlot = slot === 'primary' ? 'PRIMARY' as const : 'SECONDARY' as const;
    const updatedWeapons = (raw.inventoryWeapons ?? []).map(w => {
      if (w.weaponId === weaponId) {
        return { ...w, equipped: true, slot: apiSlot };
      }
      return w;
    });

    const updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, {
        inventoryWeapons: updatedWeapons.map(w => ({
          weaponId: w.weaponId,
          equipped: w.equipped,
          ...(w.slot ? { slot: w.slot } : {}),
        })),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.rawSheet.set(raw);
          this.characterSheet.set(mapToCharacterSheetView(raw));
          this.swapInFlight.set(false);
        },
      });
  }

  onUnequipWeapon(slot: 'primary' | 'secondary'): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const apiSlot = slot === 'primary' ? 'PRIMARY' : 'SECONDARY';
    const updatedWeapons = (raw.inventoryWeapons ?? []).map(w => {
      if (w.slot === apiSlot) {
        return { ...w, equipped: false, slot: undefined };
      }
      return w;
    });

    const updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, {
        inventoryWeapons: updatedWeapons.map(w => ({
          weaponId: w.weaponId,
          equipped: w.equipped,
          ...(w.slot ? { slot: w.slot } : {}),
        })),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.rawSheet.set(raw);
          this.characterSheet.set(mapToCharacterSheetView(raw));
          this.swapInFlight.set(false);
        },
      });
  }

  onEquipArmor(armorId: number): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const updatedArmors = (raw.inventoryArmors ?? []).map(a => {
      if (a.armorId === armorId) {
        return { ...a, equipped: true };
      }
      return a;
    });

    const updatedRaw = { ...raw, inventoryArmors: updatedArmors };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, {
        inventoryArmors: updatedArmors.map(a => ({
          armorId: a.armorId,
          equipped: a.equipped,
        })),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.rawSheet.set(raw);
          this.characterSheet.set(mapToCharacterSheetView(raw));
          this.swapInFlight.set(false);
        },
      });
  }

  onUnequipArmor(): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const updatedArmors = (raw.inventoryArmors ?? []).map(a => ({
      ...a,
      equipped: false,
    }));

    const updatedRaw = { ...raw, inventoryArmors: updatedArmors };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, {
        inventoryArmors: updatedArmors.map(a => ({
          armorId: a.armorId,
          equipped: a.equipped,
        })),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.rawSheet.set(raw);
          this.characterSheet.set(mapToCharacterSheetView(raw));
          this.swapInFlight.set(false);
        },
      });
  }

  private swapDomainCard(cardId: number, direction: 'to-vault' | 'to-equipped'): void {
    const sheet = this.characterSheet();
    if (!sheet || this.swapInFlight()) return;

    const equipped = [...sheet.equippedDomainCards];
    const vault = [...sheet.vaultDomainCards];

    if (direction === 'to-vault') {
      const idx = equipped.findIndex(c => c.id === cardId);
      if (idx === -1) return;
      const [card] = equipped.splice(idx, 1);
      vault.push(card);
    } else {
      if (equipped.length >= sheet.maxEquippedDomainCards) return;
      const idx = vault.findIndex(c => c.id === cardId);
      if (idx === -1) return;
      const [card] = vault.splice(idx, 1);
      equipped.push(card);
    }

    this.characterSheet.set({ ...sheet, equippedDomainCards: equipped, vaultDomainCards: vault });
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(sheet.id, {
        equippedDomainCardIds: equipped.map(c => c.id),
        vaultDomainCardIds: vault.map(c => c.id),
      })
      .subscribe({
        next: () => this.swapInFlight.set(false),
        error: () => {
          this.characterSheet.set(sheet);
          this.swapInFlight.set(false);
        },
      });
  }

  private initSavePipelines(): void {
    this.healthSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const snapshot = { hp: sheet.hitPointMarked, armor: sheet.armorMarked };
        this.markSaving('health');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          hitPointMarked: this.markedHp(),
          armorMarked: this.markedArmor(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, hitPointMarked: this.markedHp(), armorMarked: this.markedArmor() } : s);
            this.localHpMarked.set(null);
            this.localArmorMarked.set(null);
            this.clearSaving('health');
          }),
          catchError(() => {
            this.localHpMarked.set(snapshot.hp);
            this.localArmorMarked.set(snapshot.armor);
            this.clearSaving('health');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.hopeStressSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const snapshot = { hope: sheet.hopeMarked, stress: sheet.stressMarked };
        this.markSaving('hopeStress');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          hopeMarked: this.markedHope(),
          stressMarked: this.markedStress(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, hopeMarked: this.markedHope(), stressMarked: this.markedStress() } : s);
            this.localHopeMarked.set(null);
            this.localStressMarked.set(null);
            this.clearSaving('hopeStress');
          }),
          catchError(() => {
            this.localHopeMarked.set(snapshot.hope);
            this.localStressMarked.set(snapshot.stress);
            this.clearSaving('hopeStress');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.goldSave$.pipe(
      debounceTime(800),
      switchMap(() => {
        if (!this.isOwner()) return EMPTY;
        const sheet = this.characterSheet()!;
        const goldSnapshot = this.localGoldAdjustment();
        this.markSaving('gold');
        return this.characterSheetService.updateCharacterSheet(sheet.id, {
          gold: this.currentGold(),
        }).pipe(
          tap(() => {
            this.characterSheet.update(s => s ? { ...s, gold: this.currentGold() } : s);
            this.localGoldAdjustment.set(0);
            this.clearSaving('gold');
          }),
          catchError(() => {
            this.localGoldAdjustment.set(goldSnapshot);
            this.clearSaving('gold');
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private markSaving(section: string): void {
    this.savingSections.update(s => { const n = new Set(s); n.add(section); return n; });
  }

  private clearSaving(section: string): void {
    this.savingSections.update(s => { const n = new Set(s); n.delete(section); return n; });
  }
}
