import { useState } from 'react';
import { Input } from '../common';

interface DurationOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const defaultDurations: DurationOption[] = [
  { value: 'ask', label: 'Always Ask' },
  { value: '1', label: '1 minute' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: 'restart', label: 'Until browser restart' },
  { value: 'custom', label: 'Custom', isCustom: true },
];

interface DurationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const DurationSelector = ({ value, onChange }: DurationSelectorProps) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (optionValue: string) => {
    if (optionValue === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      onChange(optionValue);
    }
  };

  const handleCustomSubmit = () => {
    if (customMinutes && parseInt(customMinutes) > 0) {
      onChange(customMinutes);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-secondary">
        Unlock Duration
      </label>
      <div className="space-y-2">
        {defaultDurations.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center p-3 rounded-btn border-2 cursor-pointer transition-smooth
              ${
                value === option.value || (showCustomInput && option.isCustom)
                  ? 'border-accent-primary bg-bg-accent'
                  : 'border-border hover:border-border-focus'
              }
            `}
          >
            <input
              type="radio"
              name="duration"
              value={option.value}
              checked={value === option.value || (showCustomInput && option.isCustom)}
              onChange={() => handleSelect(option.value)}
              className="w-4 h-4 text-accent-primary focus:ring-accent-primary focus:ring-offset-bg-primary"
            />
            <span className="ml-3 text-sm font-medium text-text-primary">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      {showCustomInput && (
        <div className="mt-3 animate-slideUp">
          <Input
            type="number"
            value={customMinutes}
            onChange={setCustomMinutes}
            onEnter={handleCustomSubmit}
            placeholder="Enter minutes"
            label="Custom duration (minutes)"
          />
        </div>
      )}
    </div>
  );
};
