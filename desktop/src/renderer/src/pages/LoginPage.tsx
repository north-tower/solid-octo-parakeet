import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { PasswordField } from '../components/PasswordField';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../utils/validation';

export function LoginPage() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [referralStatus, setReferralStatus] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const debouncedReferralCode = useDebouncedValue(referralCode.trim(), 400);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmError =
    mode === 'register' && touched.confirmPassword
      ? validatePasswordConfirm(password, confirmPassword)
      : null;

  useEffect(() => {
    if (mode !== 'register' || !debouncedReferralCode) {
      setReferralStatus('idle');
      setReferrerName(null);
      return;
    }

    let cancelled = false;
    setReferralStatus('checking');

    void api
      .validateReferralCode(debouncedReferralCode)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.valid) {
          setReferralStatus('valid');
          setReferrerName(result.referrerDisplayName ?? 'Player');
        } else {
          setReferralStatus('invalid');
          setReferrerName(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReferralStatus('invalid');
          setReferrerName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedReferralCode, mode]);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setTouched({});
    setReferralStatus('idle');
    setReferrerName(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
    });

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmError =
      mode === 'register'
        ? validatePasswordConfirm(password, confirmPassword)
        : null;

    if (nextEmailError || nextPasswordError || nextConfirmError) {
      return;
    }

    if (
      mode === 'register' &&
      referralCode.trim() &&
      referralStatus === 'invalid'
    ) {
      showToast('Referral code is invalid', 'error');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          displayName: displayName || undefined,
          referralCode: referralCode.trim() || undefined,
        });
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Authentication failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Gamer Mining Rewards</p>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="muted">
          Mine in the background, earn coins, level up, and redeem gamer rewards.
        </p>

        <form className="stack" onSubmit={onSubmit} noValidate>
          {mode === 'register' && (
            <label className="field">
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="NightRaider"
              />
            </label>
          )}

          <label className={`field ${emailError ? 'field-error' : ''}`}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              aria-invalid={Boolean(emailError)}
            />
            {emailError && <span className="field-message error">{emailError}</span>}
          </label>

          <PasswordField
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() =>
              setTouched((current) => ({ ...current, password: true }))
            }
            error={passwordError}
          />

          {mode === 'register' && (
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, confirmPassword: true }))
              }
              error={confirmError}
            />
          )}

          {mode === 'register' && (
            <label className="field">
              <span>Referral code</span>
              <input
                value={referralCode}
                onChange={(event) =>
                  setReferralCode(event.target.value.toUpperCase())
                }
                placeholder="Optional"
              />
              {referralCode.trim() && referralStatus === 'checking' && (
                <span className="field-message muted">Checking code…</span>
              )}
              {referralStatus === 'valid' && referrerName && (
                <span className="field-message success">
                  ✓ Referred by {referrerName}
                </span>
              )}
              {referralStatus === 'invalid' && (
                <span className="field-message error">
                  Unknown referral code
                </span>
              )}
            </label>
          )}

          <button className="primary" type="submit" disabled={loading}>
            {loading && <Spinner size={16} />}
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Sign up'}
          </button>
        </form>

        <button
          className="link-button"
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login'
            ? 'Need an account? Register'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
