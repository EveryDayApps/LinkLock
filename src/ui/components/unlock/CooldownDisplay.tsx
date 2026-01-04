import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Button } from '../common';

interface CooldownDisplayProps {
  cooldownEnd: number; // timestamp
  onUseMasterPassword?: () => void;
}

export const CooldownDisplay = ({
  cooldownEnd,
  onUseMasterPassword,
}: CooldownDisplayProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, cooldownEnd - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center space-y-6 animate-slideUp">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent-danger bg-opacity-10 flex items-center justify-center">
          <Timer className="w-8 h-8 text-accent-danger" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Too Many Attempts
          </h2>
          <p className="text-text-secondary">
            Please wait before trying again
          </p>
        </div>
      </div>

      <div className="p-6 bg-bg-accent rounded-card">
        <p className="text-3xl font-mono font-bold text-accent-danger">
          {formatTime(timeRemaining)}
        </p>
      </div>

      {onUseMasterPassword && (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">Or unlock with</p>
          <Button variant="secondary" onClick={onUseMasterPassword} fullWidth>
            Use Master Password
          </Button>
        </div>
      )}
    </div>
  );
};
