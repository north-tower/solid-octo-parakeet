import { randomBytes } from 'crypto';

const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';

  for (let i = 0; i < length; i++) {
    code += REFERRAL_CODE_CHARS[bytes[i] % REFERRAL_CODE_CHARS.length];
  }

  return code;
}
