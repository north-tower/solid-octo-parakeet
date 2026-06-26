const AVATAR_KEY = 'gmr_avatar';
const PAYOUTS_KEY = 'gmr_payout_requests';
const ONBOARDING_KEY = 'gmr_onboarding_done';

export type PayoutMethod =
  | 'giftcard_amazon'
  | 'giftcard_steam'
  | 'giftcard_xbox'
  | 'giftcard_playstation'
  | 'giftcard_netflix'
  | 'giftcard_roblox'
  | 'giftcard_google'
  | 'giftcard_apple';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface LocalPayoutRequest {
  id: string;
  amount: string;
  method: PayoutMethod;
  destination: string;
  status: PayoutStatus;
  createdAt: string;
}

export function getAvatarPreference(): string | null {
  return localStorage.getItem(AVATAR_KEY);
}

export function setAvatarPreference(value: string | null) {
  if (value) {
    localStorage.setItem(AVATAR_KEY, value);
  } else {
    localStorage.removeItem(AVATAR_KEY);
  }
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export function getLocalPayouts(): LocalPayoutRequest[] {
  try {
    const raw = localStorage.getItem(PAYOUTS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as LocalPayoutRequest[];
  } catch {
    return [];
  }
}

export function addLocalPayout(payout: LocalPayoutRequest) {
  const existing = getLocalPayouts();
  localStorage.setItem(PAYOUTS_KEY, JSON.stringify([payout, ...existing]));
}

export function payoutMethodLabel(method: PayoutMethod) {
  switch (method) {
    case 'giftcard_amazon':
      return 'Amazon Gift Card';
    case 'giftcard_steam':
      return 'Steam Gift Card';
    case 'giftcard_xbox':
      return 'Xbox Gift Card';
    case 'giftcard_playstation':
      return 'PlayStation Gift Card';
    case 'giftcard_netflix':
      return 'Netflix Gift Card';
    case 'giftcard_roblox':
      return 'Roblox Gift Card';
    case 'giftcard_google':
      return 'Google Play Gift Card';
    case 'giftcard_apple':
      return 'Apple Gift Card';
    default:
      return method;
  }
}

export function payoutStatusLabel(status: PayoutStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}
