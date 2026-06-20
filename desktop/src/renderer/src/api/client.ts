import { DEFAULT_API_URL } from '@shared/constants';

const TOKEN_KEY = 'gmr_access_token';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBaseUrl() {
  return import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function hasAccessToken() {
  return Boolean(getToken());
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    coinBalance: string;
    level: number;
    xp: number;
    miningPowerPercent: number;
  };
}

export interface DashboardResponse {
  profile: {
    id: string;
    email: string;
    displayName: string | null;
    referralCode: string;
    miningPowerPercent: number;
    referralsCount: number;
  };
  progression: {
    xp: number;
    level: number;
    referralPercent: number;
    currentLevelXpFloor: number;
    nextLevelXpTarget: number | null;
    xpToNextLevel: number | null;
  };
  wallet: {
    coinBalance: string;
  };
  mining: {
    completedSessions: number;
    totalSecondsMined: number;
    totalRawMinedValue: string;
  };
  activeSession: {
    id: string;
    startedAt: string;
    status: string;
  } | null;
}

export interface MiningSessionResponse {
  id: string;
  status: string;
  startedAt: string;
  miningPowerPercent: number;
}

export interface CompleteSessionResponse {
  rewards: {
    coinAmount: string;
    balanceAfter: string;
  };
  progression: {
    xpEarned: number;
    totalXp: number;
    currentLevel: number;
    leveledUp: boolean;
  };
}

export interface ReferralValidationResponse {
  valid: boolean;
  referrerDisplayName?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string | null;
  referralCode: string;
  xp: number;
  level: number;
  coinBalance: string;
  miningPowerPercent: number;
  referralPercent: number;
  xpToNextLevel: number | null;
  referralsCount: number;
  totalReferralEarnings: string;
  createdAt: string;
}

export interface SessionHistoryResponse {
  sessions: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    totalSeconds: number;
    hashrate: string | null;
    sharesAccepted: number;
    coinsEarned: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReferralsDashboardResponse {
  profile: {
    referralCode: string;
    referralsCount: number;
  };
  progression: {
    level: number;
    xp: number;
    referralPercent: number;
    currentLevelXpFloor: number;
    nextLevelXpTarget: number | null;
    xpToNextLevel: number | null;
    nextLevelReferralPercent: number | null;
  };
  earnings: {
    totalEarned: string;
    totalSessions: number;
  };
  referredUsers: Array<{
    id: string;
    displayName: string | null;
    email: string;
    joinedAt: string;
    totalEarnedFromUser: string;
    sessionsCount: number;
  }>;
  recentEarnings: Array<{
    id: string;
    amountEarned: string;
    commissionBase: string;
    referrerRate: string;
    referredUser: {
      id: string;
      displayName: string | null;
      email: string;
    };
    miningSessionId: string;
    createdAt: string;
  }>;
}

export interface RewardRequestItem {
  id: string;
  status: string;
  createdAt: string;
  catalogItem: {
    id: string;
    name: string;
    gameSlug: string;
    coinCost: string;
  };
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    password: string;
    displayName?: string;
    referralCode?: string;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  validateReferralCode: (code: string) =>
    request<ReferralValidationResponse>(
      `/auth/referral-codes/${encodeURIComponent(code.trim().toUpperCase())}/validate`,
    ),

  getDashboard: () => request<DashboardResponse>('/gamification/me'),

  getProfile: () => request<UserProfileResponse>('/users/me'),

  updateProfile: (displayName: string) =>
    request<{ id: string; email: string; displayName: string | null }>(
      '/users/me',
      {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      },
    ),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getSessionHistory: (page = 1, limit = 20) =>
    request<SessionHistoryResponse>(
      `/gamification/mining-sessions/history?page=${page}&limit=${limit}`,
    ),

  getReferrals: () => request<ReferralsDashboardResponse>('/referrals/me'),

  getRewardRequests: () =>
    request<{ requests: RewardRequestItem[] }>('/rewards/requests/me'),

  createRewardRequest: (catalogItemId: string) =>
    request('/rewards/requests', {
      method: 'POST',
      body: JSON.stringify({ catalogItemId }),
    }),

  updateMiningPower: (miningPowerPercent: number) =>
    request<{ miningPowerPercent: number }>('/gamification/me/mining-power', {
      method: 'PATCH',
      body: JSON.stringify({ miningPowerPercent }),
    }),

  startSession: (miningPowerPercent: number) =>
    request<MiningSessionResponse>('/gamification/mining-sessions/start', {
      method: 'POST',
      body: JSON.stringify({ miningPowerPercent }),
    }),

  sendHeartbeat: (
    sessionId: string,
    payload: {
      powerPercent: number;
      hashrate?: string;
      sharesAccepted?: number;
    },
  ) =>
    request(`/gamification/mining-sessions/${sessionId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeSession: (
    sessionId: string,
    payload: {
      totalSeconds: number;
      secondsAbove80Percent: number;
      rawMinedValue: string;
      avgPowerPercent?: number;
      peakPowerPercent?: number;
      hashrate?: string;
      sharesAccepted?: number;
    },
  ) =>
    request<CompleteSessionResponse>(
      `/gamification/mining-sessions/${sessionId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  abortSession: (sessionId: string) =>
    request(`/gamification/mining-sessions/${sessionId}/abort`, {
      method: 'POST',
    }),
};
