import { Receipt } from 'lucide-react';
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

const CONVERSION_RATE = '1 coin ≈ $0.001 USD';

export function RedeemPage() {
  const { dashboard } = useMining();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('crypto_btc');
  const [destination, setDestination] = useState('');
  const [localPayouts, setLocalPayouts] = useState<LocalPayoutRequest[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequestItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocalPayouts(getLocalPayouts());
    void api
      .getRewardRequests()
      .then((response) => setRewardRequests(response.requests ?? []))
      .catch(() => {
        // optional
      });
  }, []);

  const balance = useMemo(
    () => Number.parseFloat(dashboard?.wallet.coinBalance ?? '0'),
    [dashboard?.wallet.coinBalance],
  );

  const parsedAmount = Number.parseFloat(amount);
  const meetsMinimum = balance >= MIN_PAYOUT_COINS;
  const amountValid =
    !Number.isNaN(parsedAmount) &&
    parsedAmount >= MIN_PAYOUT_COINS &&
    parsedAmount <= balance;
  const destinationValid = destination.trim().length >= 8;
  const canSubmit = !submitting && meetsMinimum && amountValid && destinationValid;

  const submitPayout = () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      const payout: LocalPayoutRequest = {
        id: crypto.randomUUID(),
        amount: parsedAmount.toFixed(8),
        method,
        destination: destination.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      addLocalPayout(payout);
      setLocalPayouts(getLocalPayouts());
      setAmount('');
      setDestination('');
      showToast('Payout request submitted successfully', 'success');
      addNotification({
        type: 'payout_processed',
        title: 'Payout requested',
        message: `${formatCoins(payout.amount)} coins payout is pending review.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabledReason = !meetsMinimum
    ? `You need at least ${MIN_PAYOUT_COINS} coins to redeem`
    : !destinationValid && destination.length > 0
      ? 'Enter a valid wallet address or email'
      : !amountValid && amount.length > 0
        ? `Enter an amount between ${MIN_PAYOUT_COINS} and ${formatCoins(balance)}`
        : !canSubmit && !submitting
          ? `You need at least ${MIN_PAYOUT_COINS} coins to redeem`
          : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wallet</p>
          <h1>Redeem & withdraw</h1>
        </div>
      </header>

      <section className="grid grid-4">
        <article className="panel wallet-hero">
          <h2>Redeemable balance</h2>
          <p className="metric">{formatCoins(dashboard?.wallet.coinBalance ?? '0')}</p>
          <p className="metric-caption">coins available</p>
        </article>
        <article className="panel stat-card">
          <h2>Minimum threshold</h2>
          <p className="metric">{MIN_PAYOUT_COINS}</p>
          <p className="metric-caption">coins required to withdraw</p>
        </article>
        <article className="panel stat-card">
          <h2>Conversion rate</h2>
          <p className="metric-caption">{CONVERSION_RATE}</p>
        </article>
        <article className="panel stat-card">
          <h2>Review time</h2>
          <p className="metric-caption">Payout requests are reviewed within 24 hours</p>
        </article>
      </section>

      <section className="panel form-panel">
        <h2>Request payout</h2>

        <label className="field">
          <span>Amount (coins)</span>
          <input
            type="number"
            min={MIN_PAYOUT_COINS}
            step="0.00000001"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`Minimum ${MIN_PAYOUT_COINS}`}
          />
        </label>

        <label className="field">
          <span>Payout method</span>
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value as PayoutMethod)}
          >
            <option value="crypto_btc">Bitcoin (BTC)</option>
            <option value="crypto_eth">Ethereum (ETH)</option>
            <option value="paypal">PayPal</option>
          </select>
        </label>

        <label className="field">
          <span>Destination address / email</span>
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Wallet address or PayPal email"
          />
        </label>

        <div className="submit-row">
          <button
            type="button"
            className="primary"
            disabled={!canSubmit}
            title={disabledReason ?? undefined}
            onClick={submitPayout}
          >
            {submitting ? 'Submitting…' : 'Request payout'}
          </button>
          {disabledReason && (
            <p className="field-hint muted">{disabledReason}</p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Payout history</h2>
        {localPayouts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <Receipt size={40} strokeWidth={1.25} />
            </span>
            <h3>No payouts yet</h3>
            <p className="muted">
              Your redemption history will show up here once you request a payout.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {localPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td>{formatDate(payout.createdAt)}</td>
                    <td>{formatCoins(payout.amount)}</td>
                    <td>{payoutMethodLabel(payout.method)}</td>
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
        <section className="panel">
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
