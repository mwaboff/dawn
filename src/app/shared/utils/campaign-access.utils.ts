import { CampaignResponse } from '../models/campaign-api.model';

/**
 * Whether `userId` is one of `campaign`'s game masters. Pure and admin-unaware on purpose -- the
 * admin override composes at the call site (`isCampaignGameMaster(...) || authService.isAdmin()`)
 * since admin-ness comes from `AuthService` and this util needs to stay trivially testable.
 */
export function isCampaignGameMaster(
  campaign: CampaignResponse | null | undefined,
  userId: number | null | undefined,
): boolean {
  return campaign != null && userId != null && campaign.gameMasterIds.includes(userId);
}
