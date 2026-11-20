/**
 * Global Configuration for Account Sections
 *
 * Controls visibility of:
 * - Saved Coupons
 * - Saved Creations
 * - Connected Accounts
 * - Reward History
 *
 * Set `HIDE_ACCOUNT_EXTRA_SECTIONS = true` to hide all 4 sections across the entire site.
 * Set `HIDE_ACCOUNT_EXTRA_SECTIONS = false` to show them.
 */
export const HIDE_ACCOUNT_EXTRA_SECTIONS = true

export const ACCOUNT_FEATURE_FLAGS = {
  // Master toggle controls all 4 sections; you can also toggle them individually if desired
  savedCoupons: !HIDE_ACCOUNT_EXTRA_SECTIONS,
  savedCreations: !HIDE_ACCOUNT_EXTRA_SECTIONS,
  connectedAccounts: !HIDE_ACCOUNT_EXTRA_SECTIONS,
  rewardHistory: !HIDE_ACCOUNT_EXTRA_SECTIONS,
} as const

export function isAccountSectionEnabled(sectionId: string): boolean {
  switch (sectionId) {
    case "coupons":
    case "saved-coupon":
      return ACCOUNT_FEATURE_FLAGS.savedCoupons
    case "creations":
    case "saved-creation":
      return ACCOUNT_FEATURE_FLAGS.savedCreations
    case "connected-accounts":
      return ACCOUNT_FEATURE_FLAGS.connectedAccounts
    case "rewards":
    case "reward-history":
      return ACCOUNT_FEATURE_FLAGS.rewardHistory
    default:
      return true
  }
}

