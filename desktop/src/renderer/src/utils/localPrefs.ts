const AVATAR_KEY = 'gmr_avatar';
const PAYOUTS_KEY = 'gmr_payout_requests';
const ONBOARDING_KEY = 'gmr_onboarding_done';

export type PayoutMethod = 'crypto_btc' | 'crypto_eth' | 'paypal';
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
    case 'crypto_btc':
      return 'Bitcoin (BTC)';
    case 'crypto_eth':
      return 'Ethereum (ETH)';
    case 'paypal':
      return 'PayPal';
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
