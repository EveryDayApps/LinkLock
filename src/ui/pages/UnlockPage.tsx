import { useState } from 'react';
import {
  UnlockLayout,
  PasswordInput,
  DurationSelector,
  SnoozePanel,
  CooldownDisplay,
} from '../components/unlock';
import { Button } from '../components/common';
import { Unlock } from 'lucide-react';

export const UnlockPage = () => {
  const [password, setPassword] = useState('');
  const [duration, setDuration] = useState('5');
  const [hasError, setHasError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownEnd] = useState(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  const handleUnlock = () => {
    // Mock validation
    if (password === 'demo') {
      console.log('Unlocking with duration:', duration);
      setHasError(false);
      setPassword('');
    } else {
      setHasError(true);
      setFailedAttempts((prev) => prev + 1);

      // Trigger cooldown after 3 failed attempts
      if (failedAttempts >= 2) {
        setIsInCooldown(true);
      }
    }
  };

  const handleSnooze = (minutes: number) => {
    console.log('Snoozing for', minutes, 'minutes');
  };

  const handleUseMasterPassword = () => {
    console.log('Using master password');
    setIsInCooldown(false);
    setFailedAttempts(0);
  };

  return (
    <UnlockLayout siteName="example.com">
      {isInCooldown ? (
        <CooldownDisplay
          cooldownEnd={cooldownEnd}
          onUseMasterPassword={handleUseMasterPassword}
        />
      ) : (
        <>
          <PasswordInput
            value={password}
            onChange={setPassword}
            onSubmit={handleUnlock}
            hasError={hasError}
            error={hasError ? 'Incorrect password' : undefined}
          />

          {failedAttempts > 0 && failedAttempts < 3 && (
            <p className="text-sm text-accent-warning">
              Failed attempts: {failedAttempts}/3
            </p>
          )}

          <DurationSelector value={duration} onChange={setDuration} />

          <Button
            variant="primary"
            fullWidth
            onClick={handleUnlock}
            leftIcon={<Unlock className="w-5 h-5" />}
          >
            Unlock Site
          </Button>

          <SnoozePanel onSnooze={handleSnooze} />
        </>
      )}
    </UnlockLayout>
  );
};
