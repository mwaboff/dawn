import { Observable, catchError, map, of } from 'rxjs';

import { LookupOption } from '../../../shared/components/entity-form/entity-form.types';
import { CampaignService } from '../../../shared/services/campaign.service';

/** Enough campaigns to cover any realistic table list without paging the picker. */
const CAMPAIGN_PAGE_SIZE = 100;

/**
 * The two pieces of plumbing every host of `ItemForm` needs, kept here so the routed builder and
 * the character sheet's create-item modal cannot drift apart: both must offer the same campaigns
 * and read the same failures out of the same backend.
 */

/**
 * Campaigns the signed-in user may share new homebrew with.
 *
 * A failure here is not worth an error state: the picker simply offers nothing, and the item still
 * saves. Sharing is optional, and can be added later from the edit page.
 */
export function shareableCampaignOptions(
  campaignService: CampaignService,
): Observable<LookupOption[]> {
  return campaignService.getMyCampaigns(0, CAMPAIGN_PAGE_SIZE).pipe(
    map(response =>
      response.content
        // Ended campaigns are history; sharing new homebrew into one helps nobody.
        .filter(campaign => !campaign.isEnded)
        .map(campaign => ({ id: campaign.id, label: campaign.name })),
    ),
    catchError(() => of([])),
  );
}

/**
 * Turns a failed save into something a user can act on.
 *
 * `fieldErrors` is checked first and spelled out in full: this backend's `ValidationErrorResponse`
 * sends per-field messages with no top-level `message` at all, so reading only `message` would
 * replace "Severe threshold must not be null" with a shrug. Attaching these to the individual
 * controls would be better still, but that needs a new input on the presentational form -- see the
 * bd issue.
 */
export function readSaveErrorMessage(err: unknown): string {
  const body = (err as { error?: { message?: string; fieldErrors?: Record<string, string> } } | null)
    ?.error;

  const fieldErrors = body?.fieldErrors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
  }

  return body?.message ?? 'Save failed. Please try again.';
}
