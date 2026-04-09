import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { WeaponResponse } from '../../../../shared/models/weapon-api.model';
import { ArmorResponse } from '../../../../shared/models/armor-api.model';
import { LootApiResponse } from '../../../../shared/models/loot-api.model';
import { PaginatedResponse } from '../../../../shared/models/api.model';

@Component({
  selector: 'app-inventory-add-panel',
  templateUrl: './inventory-add-panel.html',
  styleUrl: './inventory-add-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryAddPanel {
  private readonly http = inject(HttpClient);

  readonly itemType = input.required<'weapon' | 'armor' | 'loot'>();
  readonly open = input.required<boolean>();

  readonly itemAdded = output<WeaponResponse | ArmorResponse | LootApiResponse>();
  readonly closed = output<void>();

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly weaponItems = signal<WeaponResponse[]>([]);
  readonly armorItems = signal<ArmorResponse[]>([]);
  readonly lootItems = signal<LootApiResponse[]>([]);

  loadItems(): void {
    const type = this.itemType();
    this.loading.set(true);
    this.loadError.set(false);

    if (type === 'weapon') {
      const params = new HttpParams()
        .set('page', 0)
        .set('size', 50)
        .set('expand', 'features');
      this.http.get<PaginatedResponse<WeaponResponse>>(
        `${environment.apiUrl}/dh/weapons`,
        { params, withCredentials: true },
      ).subscribe({
        next: (res) => {
          this.weaponItems.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else if (type === 'armor') {
      const params = new HttpParams()
        .set('page', 0)
        .set('size', 50)
        .set('expand', 'features');
      this.http.get<PaginatedResponse<ArmorResponse>>(
        `${environment.apiUrl}/dh/armors`,
        { params, withCredentials: true },
      ).subscribe({
        next: (res) => {
          this.armorItems.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    } else {
      const params = new HttpParams()
        .set('page', 0)
        .set('size', 50)
        .set('expand', 'features,costTags');
      this.http.get<PaginatedResponse<LootApiResponse>>(
        `${environment.apiUrl}/dh/loot`,
        { params, withCredentials: true },
      ).subscribe({
        next: (res) => {
          this.lootItems.set(res.content);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onSelectWeapon(weapon: WeaponResponse): void {
    this.itemAdded.emit(weapon);
  }

  onSelectArmor(armor: ArmorResponse): void {
    this.itemAdded.emit(armor);
  }

  onSelectLoot(loot: LootApiResponse): void {
    this.itemAdded.emit(loot);
  }
}
