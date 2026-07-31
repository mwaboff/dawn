import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';
import { BeastformService } from '../../../../shared/services/beastform.service';
import {
  BeastformDamageRollResponse,
  BeastformDamageType,
  BeastformResponse,
} from '../../../../shared/models/beastform-api.model';
import { tierForLevel } from '../../utils/beastform-access.utils';

export interface BeastformFeatureView {
  id: number;
  name: string;
  description: string;
}

export interface BeastformView {
  id: number;
  name: string;
  tier: number;
  /** Compact collapsed-row summary, e.g. `Agility +1 · Ev +2 · d6 phy`. Null for stat-less cards. */
  statLine: string | null;
  /** Expanded attack line, e.g. `Melee · Instinct · d6 phy`. Null for stat-less cards. */
  attackLine: string | null;
  advantages: string | null;
  features: BeastformFeatureView[];
}

const DAMAGE_TYPE_LABELS: Record<BeastformDamageType, string> = {
  PHYSICAL: 'phy',
  MAGIC: 'mag',
  PHYSICAL_AND_MAGIC: 'phy/mag',
};

const TRAIT_MODIFIER_KEYS = [
  ['Agility', 'agilityModifier'],
  ['Strength', 'strengthModifier'],
  ['Finesse', 'finesseModifier'],
  ['Instinct', 'instinctModifier'],
  ['Presence', 'presenceModifier'],
  ['Knowledge', 'knowledgeModifier'],
] as const satisfies readonly (readonly [string, keyof BeastformResponse])[];

function formatTitleCase(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * The "Evolved" meta-cards (Legendary Beast, Mythic Beast) carry no damage at all, and even when
 * `damage` is present the backend may omit `notation`, so every field here is treated as absent
 * until proven otherwise. Dice COUNT is deliberately not rendered -- a beastform attack rolls a
 * number of dice equal to the character's Proficiency, so only the die size is a property of the
 * form.
 */
function formatDamage(damage: BeastformDamageRollResponse | undefined): string | null {
  if (!damage) return null;
  if (damage.notation) return damage.notation;
  if (!damage.diceType) return null;

  const modifier = damage.modifier ? formatSigned(damage.modifier) : '';
  const type = DAMAGE_TYPE_LABELS[damage.damageType] ?? '';
  return `${damage.diceType.toLowerCase()}${modifier}${type ? ` ${type}` : ''}`.trim();
}

function toTraitParts(form: BeastformResponse): string[] {
  return TRAIT_MODIFIER_KEYS.flatMap(([label, key]) => {
    const value = form[key];
    return typeof value === 'number' && value !== 0 ? [`${label} ${formatSigned(value)}`] : [];
  });
}

function toBeastformView(form: BeastformResponse): BeastformView {
  const damage = formatDamage(form.damage);
  const statParts = [
    ...toTraitParts(form),
    form.evasion != null ? `Ev ${formatSigned(form.evasion)}` : null,
    damage,
  ].filter((part): part is string => part !== null);

  const attackParts = [
    formatTitleCase(form.attackRange),
    formatTitleCase(form.attackTrait),
    damage,
  ].filter((part): part is string => part !== null);

  return {
    id: form.id,
    name: form.name,
    tier: form.tier as number,
    statLine: statParts.length > 0 ? statParts.join(' · ') : null,
    attackLine: attackParts.length > 0 ? attackParts.join(' · ') : null,
    advantages: form.advantages?.trim() ? form.advantages : null,
    features: (form.features ?? []).map(feature => ({
      id: feature.id,
      name: feature.name,
      description: feature.description ?? '',
    })),
  };
}

@Component({
  selector: 'app-beastform-section',
  templateUrl: './beastform-section.html',
  styleUrl: './beastform-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class BeastformSection {
  private readonly beastformService = inject(BeastformService);

  readonly characterLevel = input.required<number>();

  readonly expanded = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  private readonly forms = signal<BeastformResponse[]>([]);
  private readonly loaded = signal(false);
  private readonly expandedFormIds = signal<ReadonlySet<number>>(new Set());

  readonly tier = computed(() => tierForLevel(this.characterLevel()));

  /**
   * Beastform grants every option "of your tier or lower", so this is a pure tier filter -- there
   * is nothing per-character to unlock. Forms with no tier at all are excluded rather than
   * defaulted, since we cannot tell whether the character has reached them.
   */
  private readonly accessibleForms = computed(() => {
    const maxTier = this.tier();
    return this.forms().filter(form => form.tier != null && form.tier <= maxTier);
  });

  readonly availableCount = computed(() => this.accessibleForms().length);

  /** Flat list in the sheet's card-group order: lowest tier first, alphabetical within a tier. */
  readonly beastforms = computed<BeastformView[]>(() =>
    this.accessibleForms()
      .map(toBeastformView)
      .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name)),
  );

  readonly isEmpty = computed(() => this.loaded() && this.availableCount() === 0);

  isFormExpanded(id: number): boolean {
    return this.expandedFormIds().has(id);
  }

  /** Lazy load: nothing is fetched until the player first opens the Beastform Options card. */
  toggleSection(): void {
    const nowExpanded = !this.expanded();
    this.expanded.set(nowExpanded);
    if (nowExpanded && !this.loaded() && !this.loading()) {
      this.loadForms();
    }
  }

  toggleForm(id: number): void {
    this.expandedFormIds.update(current => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  loadForms(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.beastformService.getAllBeastforms().subscribe({
      next: forms => {
        this.forms.set(forms);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
