import { useState, type InputHTMLAttributes } from 'react';

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string | null;
}

export function PasswordField({
  label,
  error,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className={`field ${error ? 'field-error' : ''}`} htmlFor={fieldId}>
      <span>{label}</span>
      <div className="password-wrap">
        <input
          {...inputProps}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {error && (
        <span className="field-message error" id={`${fieldId}-error`}>
          {error}
        </span>
      )}
    </label>
  );
}
