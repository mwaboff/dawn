import { CardData } from '../../../shared/components/daggerheart-card/daggerheart-card.model';
import { AdversaryData } from '../../../shared/components/adversary-card/adversary-card.model';
import { ColumnSpec, CardRow } from './card-table.model';
import {
  buildAdversaryRow, buildCardRow, categoryForSearchType, categoryLabel, dedupeRowsByLink,
  rowKey, sortRows, srdTypeForCategory, withSrdSuffix,
} from './card-table.utils';

function subclassCard(id: number, name: string, level: string, pathId = 42): CardData {
  return {
    id, name, description: '', cardType: 'subclass',
    metadata: {
      subclassPathId: pathId, subclassPathName: 'Warden of the Elements',
      associatedClassName: 'Druid', domainNames: ['Sage', 'Arcana'], level,
    },
  };
}

const col = (key: string, numeric = false): ColumnSpec => ({ key, label: key, width: '5rem', numeric });

function row(id: number, name: string, cells: Record<string, string> = {}): CardRow {
  return { id, name, typeLabel: 'Weapons', link: ['/admin/cards', 'weapon', id], cells, srdType: 'WEAPON' };
}

describe('card-table.utils', () => {
  describe('categoryForSearchType', () => {
    it('maps a search entity type to its admin route segment', () => {
      expect(categoryForSearchType('DOMAIN_CARD')).toBe('domainCard');
      expect(categoryForSearchType('SUBCLASS_CARD')).toBe('subclass');
    });

    it('returns null for a type with no admin category', () => {
      expect(categoryForSearchType('QUESTION')).toBeNull();
    });
  });

  describe('srdTypeForCategory', () => {
    it('maps a category id to its backend SearchableEntityType', () => {
      expect(srdTypeForCategory('weapon')).toBe('WEAPON');
      expect(srdTypeForCategory('domainCard')).toBe('DOMAIN_CARD');
    });

    it('overrides subclass to SUBCLASS_PATH, not the SUBCLASS_CARD it browses', () => {
      expect(srdTypeForCategory('subclass')).toBe('SUBCLASS_PATH');
    });

    it('returns null for an unknown category id', () => {
      expect(srdTypeForCategory('mystery')).toBeNull();
    });
  });

  describe('rowKey', () => {
    it('pairs the srdType with the id', () => {
      expect(rowKey(row(7, 'Longsword'))).toBe('WEAPON:7');
    });

    it('falls back to "none" when the row has no flaggable type', () => {
      expect(rowKey({ ...row(7, 'Longsword'), srdType: null })).toBe('none:7');
    });
  });

  describe('withSrdSuffix', () => {
    it('appends the suffix to a non-empty name when srd is true', () => {
      expect(withSrdSuffix('Core Set', true)).toBe('Core Set (SRD)');
    });

    it('leaves a non-empty name unchanged when srd is false', () => {
      expect(withSrdSuffix('Hope & Fear', false)).toBe('Hope & Fear');
    });

    it('leaves a non-empty name unchanged when srd is undefined', () => {
      expect(withSrdSuffix('Hope & Fear', undefined)).toBe('Hope & Fear');
    });

    it('never appends to a blank name, even when srd is true', () => {
      expect(withSrdSuffix('', true)).toBe('');
    });
  });

  describe('categoryLabel', () => {
    it('returns the display label for a known category', () => {
      expect(categoryLabel('domainCard')).toBe('Domain Cards');
    });

    it('falls back to the raw id when unknown', () => {
      expect(categoryLabel('mystery')).toBe('mystery');
    });
  });

  describe('buildCardRow', () => {
    it('links to the generic card editor', () => {
      const card: CardData = { id: 7, name: 'Longsword', description: '', cardType: 'weapon' };
      expect(buildCardRow(card, 'weapon', []).link).toEqual(['/admin/cards', 'weapon', 7]);
    });

    it('carries the SRD-flaggable type for its category', () => {
      const card: CardData = { id: 7, name: 'Longsword', description: '', cardType: 'weapon' };
      expect(buildCardRow(card, 'weapon', []).srdType).toBe('WEAPON');
    });

    it('flags a subclass row with SUBCLASS_PATH, not SUBCLASS_CARD', () => {
      const card: CardData = {
        id: 5, name: 'Warden', description: '', cardType: 'subclass', metadata: { subclassPathId: 42 },
      };
      expect(buildCardRow(card, 'subclass', []).srdType).toBe('SUBCLASS_PATH');
    });

    it('links a subclass card to its parent path editor', () => {
      const card: CardData = {
        id: 5, name: 'Warden', description: '', cardType: 'subclass', metadata: { subclassPathId: 42 },
      };
      expect(buildCardRow(card, 'subclass', []).link).toEqual(['/admin/cards/subclass-path', 42]);
    });

    it('falls back to the card route when a subclass has no path id', () => {
      const card: CardData = { id: 5, name: 'Warden', description: '', cardType: 'subclass' };
      expect(buildCardRow(card, 'subclass', []).link).toEqual(['/admin/cards', 'subclass', 5]);
    });

    it('title-cases enum-shaped metadata values', () => {
      const card: CardData = {
        id: 1, name: 'Longsword', description: '', cardType: 'weapon',
        metadata: { trait: 'AGILITY', burden: 'TWO_HANDED' },
      };
      const cells = buildCardRow(card, 'weapon', [col('trait'), col('burden')]).cells;
      expect(cells['trait']).toBe('Agility');
      expect(cells['burden']).toBe('Two Handed');
    });

    it('reads nested damage notation', () => {
      const card: CardData = {
        id: 1, name: 'Longsword', description: '', cardType: 'weapon',
        metadata: { damage: { notation: 'd8+3' } },
      };
      expect(buildCardRow(card, 'weapon', [col('damage')]).cells['damage']).toBe('d8+3');
    });

    it('joins armor thresholds', () => {
      const card: CardData = {
        id: 1, name: 'Gambeson', description: '', cardType: 'armor',
        metadata: { baseMajorThreshold: 5, baseSevereThreshold: 11 },
      };
      expect(buildCardRow(card, 'armor', [col('thresholds')]).cells['thresholds']).toBe('5 / 11');
    });

    it('renders a missing metadata value as an empty cell rather than "undefined"', () => {
      const card: CardData = { id: 1, name: 'Longsword', description: '', cardType: 'weapon' };
      expect(buildCardRow(card, 'weapon', [col('tier'), col('trait')]).cells).toEqual({ tier: '', trait: '' });
    });

    it('reads the row srd flag off metadata', () => {
      const srdCard: CardData = { id: 1, name: 'Longsword', description: '', cardType: 'weapon', metadata: { srd: true } };
      const nonSrdCard: CardData = { id: 2, name: 'Dagger', description: '', cardType: 'weapon', metadata: { srd: false } };
      expect(buildCardRow(srdCard, 'weapon', []).srd).toBe(true);
      expect(buildCardRow(nonSrdCard, 'weapon', []).srd).toBe(false);
    });

    it('leaves srd undefined when metadata has no srd flag', () => {
      const card: CardData = { id: 1, name: 'Longsword', description: '', cardType: 'weapon' };
      expect(buildCardRow(card, 'weapon', []).srd).toBeUndefined();
    });

    it('renders consumable as Yes/No', () => {
      const yes: CardData = { id: 1, name: 'Potion', description: '', cardType: 'loot', metadata: { isConsumable: true } };
      const no: CardData = { id: 2, name: 'Relic', description: '', cardType: 'loot', metadata: { isConsumable: false } };
      expect(buildCardRow(yes, 'loot', [col('consumable')]).cells['consumable']).toBe('Yes');
      expect(buildCardRow(no, 'loot', [col('consumable')]).cells['consumable']).toBe('No');
    });

    describe('detail column', () => {
      it('prefers the subtitle pair', () => {
        const card: CardData = {
          id: 1, name: 'Longsword', description: 'Ignored', cardType: 'weapon',
          subtitle: 'Physical', subtitleSecondary: 'Tier 1',
        };
        expect(buildCardRow(card, 'weapon', [col('detail')]).cells['detail']).toBe('Physical · Tier 1');
      });

      it('falls back to a truncated description', () => {
        const card: CardData = { id: 1, name: 'Feature', description: `${'a'.repeat(200)}`, cardType: 'feature' };
        const detail = buildCardRow(card, 'feature', [col('detail')]).cells['detail'];
        expect(detail.length).toBe(90);
        expect(detail.endsWith('…')).toBe(true);
      });

      it('collapses whitespace in the description', () => {
        const card: CardData = { id: 1, name: 'Feature', description: 'one\n  two   three', cardType: 'feature' };
        expect(buildCardRow(card, 'feature', [col('detail')]).cells['detail']).toBe('one two three');
      });

      it('is empty when there is neither subtitle nor description', () => {
        const card: CardData = { id: 1, name: 'Feature', description: '', cardType: 'feature' };
        expect(buildCardRow(card, 'feature', [col('detail')]).cells['detail']).toBe('');
      });
    });
  });

  describe('buildAdversaryRow', () => {
    it('links to the adversary editor and fills stat cells', () => {
      const adversary: AdversaryData = {
        id: 10, name: 'Goblin', tier: 2, adversaryType: 'STANDARD', difficulty: 12, hitPointMax: 5,
      };
      const result = buildAdversaryRow(adversary, [col('tier'), col('adversaryType'), col('difficulty'), col('hp')]);
      expect(result.link).toEqual(['/admin/cards', 'adversary', 10]);
      expect(result.typeLabel).toBe('Adversaries');
      expect(result.cells).toEqual({ tier: '2', adversaryType: 'Standard', difficulty: '12', hp: '5' });
      expect(result.srdType).toBe('ADVERSARY');
    });

    it('summarizes into the detail column for cross-type results', () => {
      const adversary: AdversaryData = { id: 10, name: 'Goblin', tier: 1, adversaryType: 'MINION' };
      expect(buildAdversaryRow(adversary, [col('detail')]).cells['detail']).toBe('Minion · Tier 1');
    });

    it('reads the row srd flag off the adversary', () => {
      const srdAdversary: AdversaryData = { id: 10, name: 'Goblin', tier: 1, adversaryType: 'MINION', srd: true };
      expect(buildAdversaryRow(srdAdversary, []).srd).toBe(true);
    });

    it('leaves srd undefined when the field is absent', () => {
      const adversary: AdversaryData = { id: 10, name: 'Goblin', tier: 1, adversaryType: 'MINION' };
      expect(buildAdversaryRow(adversary, []).srd).toBeUndefined();
    });
  });

  describe('subclass rows', () => {
    it('identifies the row by the path it edits, not by the level card', () => {
      const result = buildCardRow(subclassCard(101, 'Elemental Incarnation', 'MASTERY'), 'subclass', []);
      expect(result.id).toBe(42);
      expect(result.name).toBe('Warden of the Elements');
    });

    it('keeps the card identity when there is no path to fall back on', () => {
      const card: CardData = { id: 101, name: 'Elemental Incarnation', description: '', cardType: 'subclass' };
      const result = buildCardRow(card, 'subclass', []);
      expect(result.id).toBe(101);
      expect(result.name).toBe('Elemental Incarnation');
    });
  });

  describe('dedupeRowsByLink', () => {
    const columns = [col('class'), col('domains'), col('levels')];

    it('collapses the three subclass level cards into one row per path', () => {
      const rows = dedupeRowsByLink([
        buildCardRow(subclassCard(101, 'Elemental Incarnation', 'FOUNDATION'), 'subclass', columns),
        buildCardRow(subclassCard(102, 'Elemental Incarnation', 'SPECIALIZATION'), 'subclass', columns),
        buildCardRow(subclassCard(103, 'Elemental Incarnation', 'MASTERY'), 'subclass', columns),
      ]);

      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(42);
      expect(rows[0].link).toEqual(['/admin/cards/subclass-path', 42]);
      expect(rows[0].cells['class']).toBe('Druid');
    });

    it('lists the merged levels in card order regardless of arrival order', () => {
      const rows = dedupeRowsByLink([
        buildCardRow(subclassCard(103, 'A', 'MASTERY'), 'subclass', columns),
        buildCardRow(subclassCard(101, 'A', 'FOUNDATION'), 'subclass', columns),
      ]);
      expect(rows[0].cells['levels']).toBe('Foundation · Mastery');
    });

    it('keeps separate paths as separate rows', () => {
      const rows = dedupeRowsByLink([
        buildCardRow(subclassCard(101, 'A', 'FOUNDATION', 42), 'subclass', columns),
        buildCardRow(subclassCard(201, 'B', 'FOUNDATION', 43), 'subclass', columns),
      ]);
      expect(rows.length).toBe(2);
    });

    it('preserves first-seen order', () => {
      const rows = dedupeRowsByLink([row(2, 'B'), row(1, 'A'), row(2, 'B')]);
      expect(rows.map(r => r.id)).toEqual([2, 1]);
    });

    it('backfills a cell left empty by the first row', () => {
      const rows = dedupeRowsByLink([
        { ...row(1, 'A'), cells: { class: '' } },
        { ...row(1, 'A'), cells: { class: 'Druid' } },
      ]);
      expect(rows[0].cells['class']).toBe('Druid');
    });

    it('does not mutate the input rows', () => {
      const input = [{ ...row(1, 'A'), cells: { levels: 'Foundation' } }, { ...row(1, 'A'), cells: { levels: 'Mastery' } }];
      dedupeRowsByLink(input);
      expect(input[0].cells['levels']).toBe('Foundation');
    });

    it('leaves already-unique rows untouched', () => {
      const rows = dedupeRowsByLink([row(1, 'A'), row(2, 'B'), row(3, 'C')]);
      expect(rows.map(r => r.id)).toEqual([1, 2, 3]);
    });
  });

  describe('expansion cell', () => {
    const names = new Map([[1, 'Core Set'], [2, 'Hope & Fear']]);
    const expansionCol = [col('expansion')];

    function cell(card: CardData) {
      return buildCardRow(card, 'weapon', expansionCol, names).cells['expansion'];
    }

    it('resolves an id through the lookup', () => {
      expect(cell({ id: 1, name: 'W', description: '', cardType: 'weapon', metadata: { expansionId: 2 } }))
        .toBe('Hope & Fear');
    });

    it('prefers an expansion name the API already sent', () => {
      expect(cell({
        id: 1, name: 'W', description: '', cardType: 'weapon',
        metadata: { expansionId: 1, expansionName: 'Void' },
      })).toBe('Void');
    });

    it('falls back to #id for an id missing from the lookup', () => {
      expect(cell({ id: 1, name: 'W', description: '', cardType: 'weapon', metadata: { expansionId: 99 } }))
        .toBe('#99');
    });

    it('is blank when the entity has no expansion at all', () => {
      expect(cell({ id: 1, name: 'W', description: '', cardType: 'weapon' })).toBe('');
    });

    it('resolves the id on an adversary row', () => {
      const adversary: AdversaryData = { id: 10, name: 'Goblin', tier: 1, adversaryType: 'MINION', expansionId: 1 };
      expect(buildAdversaryRow(adversary, expansionCol, names).cells['expansion']).toBe('Core Set');
    });

    it('defaults to an empty lookup when none is supplied', () => {
      expect(buildCardRow(
        { id: 1, name: 'W', description: '', cardType: 'weapon', metadata: { expansionId: 2 } },
        'weapon', expansionCol,
      ).cells['expansion']).toBe('#2');
    });
  });

  describe('sortRows', () => {
    const rows = [row(3, 'Charlie', { tier: '2' }), row(1, 'alpha', { tier: '10' }), row(2, 'Bravo', { tier: '1' })];

    it('returns the input untouched when no sort is set', () => {
      expect(sortRows(rows, null)).toBe(rows);
    });

    it('does not mutate the input array', () => {
      const original = [...rows];
      sortRows(rows, { key: 'id', direction: 'asc' });
      expect(rows).toEqual(original);
    });

    it('sorts by id numerically', () => {
      expect(sortRows(rows, { key: 'id', direction: 'asc' }).map(r => r.id)).toEqual([1, 2, 3]);
      expect(sortRows(rows, { key: 'id', direction: 'desc' }).map(r => r.id)).toEqual([3, 2, 1]);
    });

    it('sorts by name case-insensitively', () => {
      expect(sortRows(rows, { key: 'name', direction: 'asc' }).map(r => r.name))
        .toEqual(['alpha', 'Bravo', 'Charlie']);
    });

    it('sorts numeric cells by value, not lexically', () => {
      expect(sortRows(rows, { key: 'tier', direction: 'asc' }).map(r => r.cells['tier']))
        .toEqual(['1', '2', '10']);
    });

    it('sorts blank cells last in both directions', () => {
      const withBlank = [row(1, 'A', { tier: '' }), row(2, 'B', { tier: '3' })];
      expect(sortRows(withBlank, { key: 'tier', direction: 'asc' }).map(r => r.id)).toEqual([2, 1]);
      expect(sortRows(withBlank, { key: 'tier', direction: 'desc' }).map(r => r.id)).toEqual([1, 2]);
    });

    it('sorts by type label for cross-type results', () => {
      const mixed = [
        { ...row(1, 'A'), typeLabel: 'Weapons' },
        { ...row(2, 'B'), typeLabel: 'Armor' },
      ];
      expect(sortRows(mixed, { key: 'typeLabel', direction: 'asc' }).map(r => r.typeLabel))
        .toEqual(['Armor', 'Weapons']);
    });

    it('treats an unknown sort key as equal, preserving order', () => {
      expect(sortRows(rows, { key: 'nope', direction: 'asc' }).map(r => r.id)).toEqual([3, 1, 2]);
    });
  });
});
