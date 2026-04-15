import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, EMPTY, switchMap, debounceTime, tap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CharacterSheetService } from '../../core/services/character-sheet.service';
import { AuthService } from '../../core/services/auth.service';
import { SavingSpinner } from '../../shared/components/saving-spinner/saving-spinner';
import { FormatTextPipe } from '../../shared/pipes/format-text.pipe';
import { mapToCharacterSheetView } from './utils/character-sheet-view.mapper';
import { CharacterSheetView, TRAIT_SUBSKILLS, WeaponDisplay } from './models/character-sheet-view.model';
import { CharacterSheetResponse } from '../create-character/models/character-sheet-api.model';
import { InventorySection } from './components/inventory-section/inventory-section';
import { ModifierIndicator } from './components/modifier-indicator/modifier-indicator';
import { WeaponResponse } from '../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../shared/models/armor-api.model';
import { LootApiResponse } from '../../shared/models/loot-api.model';
import {
  WeaponResponse as CsWeaponResponse,
  ArmorResponse as CsArmorResponse,
  InventoryWeaponResponse,
  InventoryArmorResponse,
  InventoryLootResponse,
  UpdateCharacterSheetRequest,
} from '../create-character/models/character-sheet-api.model';
import {
  InventoryRemoveEvent,
  InventoryEquipWeaponEvent,
  InventoryEquipArmorEvent,
} from './components/inventory-section/inventory-section';

@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrls: ['./character-sheet.css', './character-sheet-layout.css', './character-sheet-panels.css', './character-sheet-equipment.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SavingSpinner, RouterLink, FormatTextPipe, InventorySection, ModifierIndicator],
})
export class CharacterSheet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterSheetService = inject(CharacterSheetService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly characterSheet = signal<CharacterSheetView | null>(null);
  readonly inventoryError = signal<string | null>(null);
  private readonly rawSheet = signal<CharacterSheetResponse | null>(null);
  private readonly expandedCardIds = signal<Set<number>>(new Set());
  private nextTempInventoryId = -1;

  private readonly localHpMarked = signal<number | null>(null);
  private readonly localStressMarked = signal<number | null>(null);
  private readonly localHopeMarked = signal<number | null>(null);
  private readonly localArmorMarked = signal<number | null>(null);
  private readonly localGoldAdjustment = signal(0);
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

  private readonly weaponEquipConstraints = computed(() => {
    const raw = this.rawSheet();
    const weapons = raw?.inventoryWeapons ?? [];
    const primarySlotOccupied = weapons.some(w => w.slot === 'PRIMARY');
    const secondarySlotOccupied = weapons.some(w => w.slot === 'SECONDARY');
    const twoHandedEquipped = weapons.some(
      w => (w.slot === 'PRIMARY' || w.slot === 'SECONDARY') && w.weapon?.burden === 'TWO_HANDED'
    );
    return { primarySlotOccupied, secondarySlotOccupied, twoHandedEquipped };
  });

  readonly weaponConstraints = computed(() => this.weaponEquipConstraints());

  readonly canEquipPrimaryWeapon = computed(() => {
    const c = this.weaponEquipConstraints();
    return !c.primarySlotOccupied && !c.twoHandedEquipped;
  });

  readonly canEquipSecondaryWeapon = computed(() => {
    const c = this.weaponEquipConstraints();
    return !c.secondarySlotOccupied && !c.twoHandedEquipped;
  });

  canEquipWeaponInSlot(weapon: WeaponDisplay, slot: 'primary' | 'secondary'): boolean {
    const c = this.weaponEquipConstraints();
    if (weapon.burden === 'TWO_HANDED') {
      return slot === 'primary' && !c.primarySlotOccupied && !c.secondarySlotOccupied && !c.twoHandedEquipped;
    }
    if (c.twoHandedEquipped) return false;
    if (slot === 'primary') return !c.primarySlotOccupied;
    return !c.secondarySlotOccupied;
  }

  readonly canEquipArmor = computed(() => {
    const raw = this.rawSheet();
    if (!raw) return false;
    return !(raw.inventoryArmors ?? []).some(a => a.equipped);
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

  onEquipWeapon(event: InventoryEquipWeaponEvent): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const targetEntry = (raw.inventoryWeapons ?? []).find(w => w.id === event.inventoryEntryId);
    if (!targetEntry || targetEntry.equipped) return;

    const { primarySlotOccupied, secondarySlotOccupied, twoHandedEquipped } = this.weaponEquipConstraints();
    const isTwoHanded = targetEntry.weapon?.burden === 'TWO_HANDED';

    let ruleError: string | null = null;
    if (isTwoHanded && (event.slot === 'secondary' || primarySlotOccupied || secondarySlotOccupied || twoHandedEquipped)) {
      ruleError = 'Two-handed weapons need both slots free. Unequip your other weapon first.';
    } else if (twoHandedEquipped) {
      ruleError = 'A two-handed weapon is already equipped. Unequip it before equipping another weapon.';
    } else if (event.slot === 'primary' && primarySlotOccupied) {
      ruleError = 'Unequip your current primary weapon before equipping a new one.';
    } else if (event.slot === 'secondary' && secondarySlotOccupied) {
      ruleError = 'Unequip your current secondary weapon before equipping a new one.';
    }

    if (ruleError) {
      this.inventoryError.set(ruleError);
      return;
    }

    const apiSlot = event.slot === 'primary' ? 'PRIMARY' as const : 'SECONDARY' as const;
    const updatedWeapons = (raw.inventoryWeapons ?? []).map(w => {
      if (w.id === event.inventoryEntryId) {
        return { ...w, equipped: true, slot: apiSlot };
      }
      return w;
    });

    const updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not equip weapon. Please try again.', raw);
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
      .updateCharacterSheet(raw.id, { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not unequip weapon. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onEquipArmor(event: InventoryEquipArmorEvent): void {
    const raw = this.rawSheet();
    if (!raw || this.swapInFlight()) return;

    const updatedArmors = (raw.inventoryArmors ?? []).map(a => {
      if (a.id === event.inventoryEntryId) {
        return { ...a, equipped: true };
      }
      return a;
    });

    const updatedRaw = { ...raw, inventoryArmors: updatedArmors };
    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));
    this.swapInFlight.set(true);

    this.characterSheetService
      .updateCharacterSheet(raw.id, { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not equip armor. Please try again.', raw);
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
      .updateCharacterSheet(raw.id, { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors })
      .subscribe({
        next: () => {
          this.inventoryError.set(null);
          this.swapInFlight.set(false);
        },
        error: () => {
          this.handleInventoryError('Could not unequip armor. Please try again.', raw);
          this.swapInFlight.set(false);
        },
      });
  }

  onAddInventoryItem(event: { type: 'weapon' | 'armor' | 'loot'; item: unknown }): void {
    const raw = this.rawSheet();
    if (!raw) return;

    const tempEntryId = this.nextTempInventoryId--;
    let updatedRaw: CharacterSheetResponse;
    let payload: UpdateCharacterSheetRequest;

    if (event.type === 'weapon') {
      const weapon = event.item as WeaponResponse;
      const newEntry: InventoryWeaponResponse = {
        id: tempEntryId,
        weaponId: weapon.id,
        equipped: false,
        weapon: weapon as unknown as CsWeaponResponse,
      };
      const updatedWeapons = [...(raw.inventoryWeapons ?? []), newEntry];
      updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
      payload = { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons };
    } else if (event.type === 'armor') {
      const armor = event.item as ArmorResponse;
      const newEntry: InventoryArmorResponse = {
        id: tempEntryId,
        armorId: armor.id,
        equipped: false,
        armor: armor as unknown as CsArmorResponse,
      };
      const updatedArmors = [...(raw.inventoryArmors ?? []), newEntry];
      updatedRaw = { ...raw, inventoryArmors: updatedArmors };
      payload = { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors };
    } else {
      const loot = event.item as LootApiResponse;
      const newEntry: InventoryLootResponse = { id: tempEntryId, lootId: loot.id, loot };
      const updatedItems = [...(raw.inventoryItems ?? []), newEntry];
      updatedRaw = { ...raw, inventoryItems: updatedItems };
      payload = { inventoryItems: this.serializeInventory(updatedRaw).inventoryItems };
    }

    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));

    this.characterSheetService.updateCharacterSheet(raw.id, payload).subscribe({
      next: () => {
        this.inventoryError.set(null);
        this.loadCharacterSheet(raw.id);
      },
      error: () => {
        this.handleInventoryError(`Could not add ${event.type}. Please try again.`, raw);
      },
    });
  }

  onRemoveInventoryItem(event: InventoryRemoveEvent): void {
    const raw = this.rawSheet();
    if (!raw) return;

    let updatedRaw: CharacterSheetResponse;
    let payload: UpdateCharacterSheetRequest;

    if (event.type === 'weapon') {
      const updatedWeapons = (raw.inventoryWeapons ?? []).filter(w => w.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryWeapons: updatedWeapons };
      payload = { inventoryWeapons: this.serializeInventory(updatedRaw).inventoryWeapons };
    } else if (event.type === 'armor') {
      const updatedArmors = (raw.inventoryArmors ?? []).filter(a => a.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryArmors: updatedArmors };
      payload = { inventoryArmors: this.serializeInventory(updatedRaw).inventoryArmors };
    } else {
      const updatedItems = (raw.inventoryItems ?? []).filter(i => i.id !== event.inventoryEntryId);
      updatedRaw = { ...raw, inventoryItems: updatedItems };
      payload = { inventoryItems: this.serializeInventory(updatedRaw).inventoryItems };
    }

    this.rawSheet.set(updatedRaw);
    this.characterSheet.set(mapToCharacterSheetView(updatedRaw));

    this.characterSheetService.updateCharacterSheet(raw.id, payload).subscribe({
      next: () => {
        this.inventoryError.set(null);
        this.loadCharacterSheet(raw.id);
      },
      error: () => {
        this.handleInventoryError(`Could not remove ${event.type}. Please try again.`, raw);
      },
    });
  }

  private serializeInventory(raw: CharacterSheetResponse): Pick<UpdateCharacterSheetRequest, 'inventoryWeapons' | 'inventoryArmors' | 'inventoryItems'> {
    return {
      inventoryWeapons: (raw.inventoryWeapons ?? []).map(w => ({
        weaponId: w.weaponId,
        equipped: w.equipped,
        ...(w.slot ? { slot: w.slot } : {}),
      })),
      inventoryArmors: (raw.inventoryArmors ?? []).map(a => ({
        armorId: a.armorId,
        equipped: a.equipped,
      })),
      inventoryItems: (raw.inventoryItems ?? []).map(i => ({ lootId: i.lootId })),
    };
  }

  private handleInventoryError(message: string, previousRaw: CharacterSheetResponse): void {
    this.rawSheet.set(previousRaw);
    this.characterSheet.set(mapToCharacterSheetView(previousRaw));
    this.inventoryError.set(message);
  }

  onDismissInventoryError(): void {
    this.inventoryError.set(null);
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
