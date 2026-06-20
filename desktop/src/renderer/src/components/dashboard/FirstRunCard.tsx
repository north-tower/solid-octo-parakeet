import { Pickaxe, X } from 'lucide-react';
import { motion } from 'framer-motion';

const DISMISS_KEY = 'gmr_first_run_dismissed';

interface FirstRunCardProps {
  visible: boolean;
  onDismiss: () => void;
}

export function getFirstRunDismissed() {
  return localStorage.getItem(DISMISS_KEY) === '1';
}

export function setFirstRunDismissed() {
  localStorage.setItem(DISMISS_KEY, '1');
}

export function FirstRunCard({ visible, onDismiss }: FirstRunCardProps) {
  if (!visible) {
    return null;
  }

  return (
    <motion.div
      className="dashboard-first-run panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="dashboard-first-run-icon" aria-hidden="true">
        <Pickaxe size={28} strokeWidth={1.75} />
      </div>
      <div className="dashboard-first-run-copy">
        <h3>Ready to earn your first coins?</h3>
        <p className="muted">
          Start a mining session below. Higher CPU power increases earnings — find
          the balance that keeps your PC responsive.
        </p>
      </div>
      <button
        type="button"
        className="dashboard-first-run-dismiss"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <X size={18} />
      </button>
    </motion.div>
  );
}
