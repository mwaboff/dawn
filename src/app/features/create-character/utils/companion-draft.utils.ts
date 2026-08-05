import { CompanionDraft } from '../models/companion-draft.model';

/** A companion's two starting Experiences are a fixed rules requirement (core-01:1319: "Create
 * two Experiences… Start with +2 in both"), not an optional flourish -- so a draft with fewer
 * than two named Experiences is not a legal starting state and must not be submitted. */
const REQUIRED_EXPERIENCE_COUNT = 2;

/**
 * Whether a drafted companion is complete enough to actually create: its two required fields
 * (`COMPANION_FORM_SCHEMA` marks `name`/`attackName` `required`) AND both starting Experiences
 * named. `CompanionCreator` emits a draft on every change regardless of completeness (so partial
 * progress survives tab navigation), so both `CreateCharacter` (deciding whether to actually
 * create one on submit) and `ReviewSection` (deciding whether to show it as "will be created")
 * need the same readiness check -- kept here, once, so the two can never disagree about what
 * counts as a companion the player has committed to. A companion is never silently created with
 * zero (or one) Experience: if either name is left blank, the whole draft is treated the same as
 * "no companion", exactly like a blank attack name already is.
 */
export function isCompanionDraftReady(draft: CompanionDraft | null): draft is CompanionDraft {
  if (!draft) return false;
  if (draft.payload.name.trim().length === 0 || draft.payload.attackName.trim().length === 0) return false;

  const namedExperiences = draft.experiences.filter(exp => exp.name.trim().length > 0);
  return namedExperiences.length >= REQUIRED_EXPERIENCE_COUNT;
}
