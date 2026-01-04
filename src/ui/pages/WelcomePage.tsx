import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from '../components/common';

type Step = 'welcome' | 'password' | 'tour';

export const WelcomePage = () => {
  const [step, setStep] = useState<Step>('welcome');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStep('tour');
  };

  const handleComplete = () => {
    console.log('Setup complete!');
    // Navigate to main app
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md animate-fadeIn">
        {step === 'welcome' && (
          <div className="text-center space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-accent-primary bg-opacity-10 flex items-center justify-center">
                <Lock className="w-12 h-12 text-accent-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Welcome to Link Lock
                </h1>
                <p className="text-text-secondary">
                  Take control of your browsing with password-protected websites
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep('password')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Get Started
            </Button>
          </div>
        )}

        {step === 'password' && (
          <Card title="Set Your Master Password" padding="lg">
            <div className="space-y-4">
              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(val) => {
                  setPassword(val);
                  setError('');
                }}
                placeholder="Enter your password"
                autoFocus
              />

              <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(val) => {
                  setConfirmPassword(val);
                  setError('');
                }}
                onEnter={handlePasswordSubmit}
                placeholder="Confirm your password"
                error={error}
              />

              <div className="space-y-2 text-sm text-text-secondary">
                <p className="flex items-center gap-2">
                  <span className={password.length >= 8 ? 'text-accent-success' : ''}>
                    {password.length >= 8 ? '✓' : '•'}
                  </span>
                  At least 8 characters
                </p>
                <p className="flex items-center gap-2">
                  <span className={/\d/.test(password) && /[a-zA-Z]/.test(password) ? 'text-accent-success' : ''}>
                    {/\d/.test(password) && /[a-zA-Z]/.test(password) ? '✓' : '•'}
                  </span>
                  Mix of letters & numbers
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handlePasswordSubmit}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {step === 'tour' && (
          <Card title="Quick Tour" padding="lg">
            <div className="space-y-6">
              <div className="bg-bg-accent rounded-btn p-8 text-center">
                <Lock className="w-16 h-16 text-accent-primary mx-auto mb-4" />
                <p className="text-text-secondary">
                  Interactive tour coming soon...
                </p>
              </div>

              <div className="space-y-3 text-sm text-text-secondary">
                <p>✓ Add locks to any website</p>
                <p>✓ Set timed unlocks</p>
                <p>✓ Create custom profiles</p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={handleComplete}>
                  Skip
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleComplete}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
