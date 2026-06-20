interface ReferralModalProps {
  referralCode: string;
  referralsCount: number;
  onClose: () => void;
}

export function ReferralModal({
  referralCode,
  referralsCount,
  onClose,
}: ReferralModalProps) {
  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="referral-modal-title"
      >
        <h2 id="referral-modal-title">Share your referral code</h2>
        <p className="muted">
          Invite friends and earn from platform commission when they mine.
        </p>
        <div className="referral-code-box">
          <code>{referralCode}</code>
          <button type="button" className="primary" onClick={() => void copyCode()}>
            Copy
          </button>
        </div>
        <p className="muted">{referralsCount} friends referred so far</p>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
