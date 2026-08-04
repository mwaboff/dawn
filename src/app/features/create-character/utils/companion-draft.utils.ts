import { CompanionDraft } from '../models/companion-draft.model';

/**
 * Whether a drafted companion has its two required fields filled in -- the same fields
 * `COMPANION_FORM_SCHEMA` marks `required` (name, attack name). `CompanionCreator` emits a draft
 * on every change regardless of completeness (so partial progress survives tab navigation), so
 * both `CreateCharacter` (deciding whether to actually create one on submit) and `ReviewSection`
 * (deciding whether to show it as "will be created") need the same readiness check -- kept here,
 * once, so the two can never disagree about what counts as a companion the player has committed
 * to.
 */
export function isCompanionDraftReady(draft: CompanionDraft | null): draft is CompanionDraft {
  return !!draft && draft.payload.name.trim().length > 0 && draft.payload.attackName.trim().length > 0;
}
