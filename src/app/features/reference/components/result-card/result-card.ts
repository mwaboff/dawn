import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { AdversaryCard } from '../../../../shared/components/adversary-card/adversary-card';
import { AdversaryData } from '../../../../shared/components/adversary-card/adversary-card.model';
import { EntityCard } from '../../../../shared/components/entity-card/entity-card';
import { CardSurfaceDirective } from '../../../../shared/directives/card-surface.directive';
import { CustomizeItemAction } from '../../../../shared/components/customize-item-action/customize-item-action';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../../../../shared/components/entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../../../shared/mappers/card-data-to-entity-card.mapper';
import { adversaryToEntityCard } from '../../../../shared/mappers/adversary-data-to-entity-card.mapper';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { PreferencesService } from '../../../../core/services/preferences.service';

/**
 * One codex result's card face. Extracted because `reference.html`'s `focusedSearch` and
 * `focusedBrowse` view modes and `ResultSection` (mixedSearch) all rendered this exact
 * adversary/card `@if`/`@else if` block verbatim -- three copies of the same branch, the template
 * duplication `.agents/rules/component-design.md` warns against.
 *
 * `sheetLayout() === 'classic'` (the default) renders exactly what all three call sites rendered
 * before this extraction, unchanged: `DaggerheartCard`/`AdversaryCard` at `layout="wide"`, followed
 * by `<app-customize-item-action [result]="result()" />` (its default `variant="classic"` --
 * classic `DaggerheartCard` has no action-row slot to project into, so this still renders as its
 * own block below the card, exactly as before).
 *
 * `'beta'` is the new branch: it swaps `DaggerheartCard` for the shared `EntityCard` face via
 * `cardDataToEntityCard`, and projects `<app-customize-item-action variant="beta">` into
 * `EntityCard`'s `[card-controls]` slot instead -- see that component's own doc comment for what
 * `variant="beta"` renders (icon buttons, not the classic text button).
 *
 * `SubclassPathSelector` is not this component's concern (it is rendered directly by `reference.html`
 * for the subclass-card view, never through here), but for anyone reworking that call site: pass
 * `[readOnly]="true"` there too -- reference is read-only browse and must never offer a Select
 * control, in either card format.
 *
 * Adversaries: beta routes through the same `EntityCard` face as the card branch, via
 * `adversaryToEntityCard` (`adversary-data-to-entity-card.mapper.ts`) -- the same mapper/component
 * pair the encounter manager's `adversary-browser`/`encounter-roster` use at `size="compact"`. Here
 * it renders at `size="expanded"`, matching the card branch's own reasoning: reference is a
 * read-everything browse surface, so the body is always visible with no click needed. Adversaries
 * never get a `CustomizeItemAction` -- they aren't in its customizable-types map, so it would render
 * nothing there anyway, and `EntityCard` gets no `card-controls` projection here as a result.
 */
@Component({
  selector: 'app-result-card',
  imports: [DaggerheartCard, AdversaryCard, EntityCard, CardSurfaceDirective, CustomizeItemAction],
  templateUrl: './result-card.html',
  styleUrl: './result-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCard {
  private readonly preferencesService = inject(PreferencesService);

  readonly result = input.required<MappedSearchResult>();

  readonly sheetLayout = this.preferencesService.sheetLayout;

  entityCard(card: CardData): EntityCardData {
    return cardDataToEntityCard(card);
  }

  adversaryEntityCard(adversary: AdversaryData): EntityCardData {
    return adversaryToEntityCard(adversary);
  }
}
