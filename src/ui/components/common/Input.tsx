import { useState } from 'react';
import { Eye, EyeOff, X, Search } from 'lucide-react';

interface InputProps {
  type?: 'text' | 'password' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onEnter?: () => void;
}

export const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  maxLength,
  onEnter,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type === 'password' ? 'password' : type === 'search' ? 'text' : type;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          className={`block text-sm font-medium mb-2 transition-smooth ${
            isFocused ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {type === 'search' && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
        )}
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={`
            w-full h-10 px-4 rounded-input bg-bg-tertiary border-2 transition-smooth
            text-text-primary placeholder-text-muted
            ${type === 'search' ? 'pl-10' : ''}
            ${error ? 'border-accent-danger' : isFocused ? 'border-border-focus' : 'border-transparent'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:border-border-focus
          `}
        />
        {type === 'password' && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-smooth"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        {type === 'search' && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-accent-danger animate-slideUp">{error}</p>
      )}
      {maxLength && (
        <p className="mt-1 text-xs text-text-muted text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};
