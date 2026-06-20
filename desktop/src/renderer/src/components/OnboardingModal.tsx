import { useState } from 'react';
import { markOnboardingComplete } from '../utils/localPrefs';

const SLIDES = [
  {
    title: 'Earn while you play',
    body: 'Gamer Mining Rewards lets you earn coins by contributing CPU power during idle time. Coins accumulate in your wallet and unlock rewards.',
  },
  {
    title: 'CPU power affects earnings',
    body: 'Higher CPU power increases hashrate and raw mined value. Find a balance that keeps your PC responsive while maximizing rewards.',
  },
  {
    title: 'Redeem your coins',
    body: 'Once you reach the minimum threshold, request a payout or redeem catalog rewards. Track history and referrals from the sidebar.',
  },
];

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    markOnboardingComplete();
    onClose();
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card onboarding-card" role="dialog" aria-modal="true">
        <div className="onboarding-dots">
          {SLIDES.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`onboarding-dot${dotIndex === index ? ' active' : ''}`}
            />
          ))}
        </div>
        <h2>{slide.title}</h2>
        <p className="muted">{slide.body}</p>
        <div className="onboarding-actions">
          <button type="button" className="ghost" onClick={finish}>
            Skip
          </button>
          <button type="button" className="primary" onClick={next}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
