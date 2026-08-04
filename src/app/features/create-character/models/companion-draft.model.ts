import { CreateCompanionRequest } from '../../../shared/models/companion-api.model';
import { Experience } from '../../../shared/models/experience.model';

/**
 * A companion assembled during character creation, before the character sheet -- and therefore
 * its `characterSheetId` -- exists yet. `characterSheetId` is filled in at submission time, once
 * `CreateCharacter.submitCharacterSheet` has the newly-created sheet's id in hand.
 *
 * Holds whatever the Companion step's form currently contains, complete or not: the step is
 * skippable (companions plan §1/§6.5, "at the GM's discretion"), so a half-filled draft is valid
 * transient state, not an error. `CreateCharacter.isCompanionDraftReady` decides at submit time
 * whether a draft is complete enough to actually create.
 */
export interface CompanionDraft {
  payload: Omit<CreateCompanionRequest, 'characterSheetId'>;
  experiences: Experience[];
}
