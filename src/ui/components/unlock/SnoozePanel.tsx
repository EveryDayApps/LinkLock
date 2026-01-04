import { Button } from '../common';
import { Clock } from 'lucide-react';

interface SnoozePanelProps {
  onSnooze: (minutes: number) => void;
}

const snoozeOptions = [
  { label: '5 min', minutes: 5 },
  { label: '30 min', minutes: 30 },
  { label: 'Today', minutes: 1440 }, // 24 hours
];

export const SnoozePanel = ({ onSnooze }: SnoozePanelProps) => {
  return (
    <div className="space-y-3">
      <div className="border-t border-border my-4" />
      <div className="text-center">
        <p className="text-sm text-text-muted mb-3 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          Quick snooze
        </p>
        <div className="flex gap-2 justify-center">
          {snoozeOptions.map((option) => (
            <Button
              key={option.label}
              variant="secondary"
              size="sm"
              onClick={() => onSnooze(option.minutes)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
