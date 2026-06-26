import { CheckCircle, Gift, Receipt } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MIN_PAYOUT_COINS } from '@shared/constants';
import { api, type RewardRequestItem } from '../api/client';
import { useToast } from '../components/Toast';
import { useMining } from '../contexts/MiningContext';
import { useNotifications } from '../contexts/NotificationsContext';
import {
  addLocalPayout,
  getLocalPayouts,
  payoutMethodLabel,
  payoutStatusLabel,
  type LocalPayoutRequest,
  type PayoutMethod,
} from '../utils/localPrefs';
import { formatCoins, formatDate } from '../utils/format';

interface GiftCard {
  id: PayoutMethod;
  brand: string;
  description: string;
  color: string;
  accent: string;
  logo: string;
  denominations: number[]; // coin cost
}

const GIFT_CARDS: GiftCard[] = [
  {
    id: 'giftcard_amazon',
    brand: 'Amazon',
    description: 'Shop millions of products',
    color: 'rgba(255, 153, 0, 0.12)',
    accent: '#FF9900',
    logo: '🛒',
    denominations: [500, 1000, 2500, 5000],
  },
  {
    id: 'giftcard_steam',
    brand: 'Steam',
    description: 'PC gaming & more',
    color: 'rgba(28, 135, 197, 0.12)',
    accent: '#1C87C5',
    logo: '🎮',
    denominations: [500, 1000, 2500],
  },
  {
    id: 'giftcard_xbox',
    brand: 'Xbox',
    description: 'Games, Gold & Game Pass',
    color: 'rgba(16, 124, 16, 0.12)',
    accent: '#107C10',
    logo: '🟩',
    denominations: [500, 1000, 2500],
  },
  {
    id: 'giftcard_playstation',
    brand: 'PlayStation',
    description: 'PS Store credit',
    color: 'rgba(0, 55, 145, 0.14)',
    accent: '#4682F4',
    logo: '🎯',
    denominations: [500, 1000, 2500],
  },
  {
    id: 'giftcard_netflix',
    brand: 'Netflix',
    description: 'Stream movies & shows',
    color: 'rgba(229, 9, 20, 0.12)',
    accent: '#E50914',
    logo: '🎬',
    denominations: [1000, 2500],
  },
  {
    id: 'giftcard_roblox',
    brand: 'Roblox',
    description: 'Robux & Premium',
    color: 'rgba(226, 35, 26, 0.12)',
    accent: '#E2231A',
    logo: '🧱',
    denominations: [250, 500, 1000],
  },
  {
    id: 'giftcard_google',
    brand: 'Google Play',
    description: 'Apps, games & content',
    color: 'rgba(52, 168, 83, 0.12)',
    accent: '#34A853',
    logo: '▶️',
    denominations: [500, 1000, 2500],
  },
  {
    id: 'giftcard_apple',
    brand: 'Apple',
    description: 'App Store & iTunes',
    color: 'rgba(148, 163, 184, 0.1)',
    accent: '#a5b4fc',
    logo: '🍎',
    denominations: [500, 1000, 2500],
  },
];

export function RedeemPage() {
  const { dashboard } = useMining();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [localPayouts, setLocalPayouts] = useState<LocalPayoutRequest[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequestItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLocalPayouts(getLocalPayouts());
    void api
      .getRewardRequests()
      .then((response) => setRewardRequests(response.requests ?? []))
      .catch(() => {});
  }, []);

  const balance = useMemo(
    () => Number.parseFloat(dashboard?.wallet.coinBalance ?? '0'),
    [dashboard?.wallet.coinBalance],
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canAfford = selectedDenomination !== null && balance >= selectedDenomination;
  const canSubmit =
    !submitting &&
    selectedCard !== null &&
    selectedDenomination !== null &&
    emailValid &&
    canAfford;

  const handleSelectCard = (card: GiftCard) => {
    setSelectedCard(card);
    setSelectedDenomination(null);
    setSuccess(false);
  };

  const submitRedeem = () => {
    if (!canSubmit || !selectedCard || !selectedDenomination) return;
    setSubmitting(true);
    try {
      const payout: LocalPayoutRequest = {
        id: crypto.randomUUID(),
        amount: String(selectedDenomination),
        method: selectedCard.id,
        destination: email.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      addLocalPayout(payout);
      setLocalPayouts(getLocalPayouts());
      setSuccess(true);
      showToast(`${selectedCard.brand} gift card request submitted!`, 'success');
      addNotification({
        type: 'payout_processed',
        title: 'Gift card requested',
        message: `${selectedCard.brand} gift card for ${formatCoins(selectedDenomination)} coins is pending.`,
      });
      setEmail('');
      setSelectedDenomination(null);
      setSelectedCard(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page redeem-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Rewards</p>
          <h1>Redeem Gift Cards</h1>
        </div>
      </header>

      {/* Balance strip */}
      <div className="redeem-balance-strip">
        <div className="redeem-balance-strip-inner">
          <div>
            <p className="redeem-balance-label">Available Balance</p>
            <p className="redeem-balance-value">{formatCoins(balance)}<span className="redeem-balance-unit"> coins</span></p>
          </div>
          <div className="redeem-balance-divider" />
          <div>
            <p className="redeem-balance-label">Minimum to redeem</p>
            <p className="redeem-balance-value redeem-balance-min">{MIN_PAYOUT_COINS}<span className="redeem-balance-unit"> coins</span></p>
          </div>
          <div className="redeem-balance-divider" />
          <div>
            <p className="redeem-balance-label">Value</p>
            <p className="redeem-balance-value redeem-balance-rate">1 coin ≈ $0.001</p>
          </div>
        </div>
      </div>

      {/* Step 1: Pick a gift card */}
      <section className="redeem-section">
        <div className="redeem-step-header">
          <span className="redeem-step-num">1</span>
          <h2>Choose a gift card</h2>
        </div>
        <div className="giftcard-grid">
          {GIFT_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`giftcard-tile${selectedCard?.id === card.id ? ' selected' : ''}`}
              style={{ '--card-accent': card.accent, '--card-bg': card.color } as React.CSSProperties}
              onClick={() => handleSelectCard(card)}
            >
              {selectedCard?.id === card.id && (
                <span className="giftcard-check">
                  <CheckCircle size={16} />
                </span>
              )}
              <span className="giftcard-logo">{card.logo}</span>
              <span className="giftcard-brand">{card.brand}</span>
              <span className="giftcard-desc">{card.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Pick denomination — slides in when a card is selected */}
      {selectedCard && (
        <section className="redeem-section redeem-section-appear">
          <div className="redeem-step-header">
            <span className="redeem-step-num">2</span>
            <h2>Select amount</h2>
          </div>
          <div className="denomination-grid">
            {selectedCard.denominations.map((coins) => {
              const usd = (coins * 0.001).toFixed(2);
              const affordable = balance >= coins;
              return (
                <button
                  key={coins}
                  type="button"
                  disabled={!affordable}
                  className={`denomination-tile${selectedDenomination === coins ? ' selected' : ''}${!affordable ? ' unaffordable' : ''}`}
                  onClick={() => setSelectedDenomination(coins)}
                >
                  <span className="denomination-usd">${usd}</span>
                  <span className="denomination-coins">{formatCoins(coins)} coins</span>
                  {!affordable && <span className="denomination-locked">Need more coins</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 3: Delivery email */}
      {selectedCard && selectedDenomination && (
        <section className="redeem-section redeem-section-appear">
          <div className="redeem-step-header">
            <span className="redeem-step-num">3</span>
            <h2>Delivery details</h2>
          </div>
          <div className="redeem-checkout panel">
            <div className="redeem-summary">
              <span className="redeem-summary-logo">{selectedCard.logo}</span>
              <div>
                <p className="redeem-summary-brand">{selectedCard.brand} Gift Card</p>
                <p className="redeem-summary-amount">
                  ${(selectedDenomination * 0.001).toFixed(2)} &mdash; {formatCoins(selectedDenomination)} coins
                </p>
              </div>
            </div>

            <label className="field">
              <span>Send code to email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {email.length > 0 && !emailValid && (
                <span className="field-hint error">Please enter a valid email address</span>
              )}
            </label>

            <div className="submit-row">
              <button
                type="button"
                className="primary redeem-submit-btn"
                disabled={!canSubmit}
                onClick={submitRedeem}
              >
                {submitting ? 'Submitting…' : (
                  <>
                    <Gift size={16} />
                    Redeem {selectedCard.brand} Gift Card
                  </>
                )}
              </button>
              {!canAfford && selectedDenomination && (
                <p className="field-hint muted">
                  You need {formatCoins(selectedDenomination - balance)} more coins for this card
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Success banner */}
      {success && (
        <div className="redeem-success-banner redeem-section-appear">
          <CheckCircle size={20} />
          <div>
            <strong>Gift card requested!</strong>
            <p>We'll email you the code within 24 hours after review.</p>
          </div>
        </div>
      )}

      {/* History */}
      <section className="panel" style={{ marginTop: 24 }}>
        <h2>Redemption history</h2>
        {localPayouts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <Receipt size={40} strokeWidth={1.25} />
            </span>
            <h3>No redemptions yet</h3>
            <p className="muted">Your gift card redemptions will show up here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gift Card</th>
                  <th>Coins</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {localPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td>{formatDate(payout.createdAt)}</td>
                    <td>{payoutMethodLabel(payout.method)}</td>
                    <td>{formatCoins(payout.amount)}</td>
                    <td className="muted">{payout.destination}</td>
                    <td>
                      <span className={`status-badge ${payout.status}`}>
                        {payoutStatusLabel(payout.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rewardRequests.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Catalog redemptions</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rewardRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>{request.catalogItem.name}</td>
                    <td>{formatCoins(request.catalogItem.coinCost)}</td>
                    <td>
                      <span className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
