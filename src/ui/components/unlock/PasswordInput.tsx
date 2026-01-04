import { useState } from 'react';
import { Input } from '../common';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
  hasError?: boolean;
}

export const PasswordInput = ({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false,
  hasError = false,
}: PasswordInputProps) => {
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit();

    if (hasError) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 300);
    }
  };

  return (
    <div className={shakeError ? 'animate-shake' : ''}>
      <Input
        type="password"
        value={value}
        onChange={onChange}
        onEnter={handleSubmit}
        placeholder="Enter password"
        autoFocus
        disabled={disabled}
        error={error}
      />
    </div>
  );
};
