import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          displayName: displayName || undefined,
          referralCode: referralCode || undefined,
        });
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Authentication failed',
      );
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

        <form className="stack" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="NightRaider"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              Referral code
              <input
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
                placeholder="Optional"
              />
            </label>
          )}

          {error && <p className="error">{error}</p>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          className="link-button"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login'
            ? 'Need an account? Register'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
