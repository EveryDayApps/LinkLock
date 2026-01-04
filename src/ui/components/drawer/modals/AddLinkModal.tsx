import { useState, useEffect } from 'react';
import { Modal, Input, Select, Toggle, Button } from '../../common';
import { appService } from '../../../../core';
import type { RuleAction, UnlockDuration } from '../../../../core';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const AddLinkModal = ({ isOpen, onClose, onSave }: AddLinkModalProps) => {
  const [url, setUrl] = useState('');
  const [action, setAction] = useState<RuleAction>('lock');
  const [unlockDuration, setUnlockDuration] = useState<string>('5');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [profiles, setProfiles] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState('');

  // Load profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      const allProfiles = appService.profileManager.getAllProfiles();
      const profileOptions = allProfiles.map((p) => ({
        value: p.id,
        label: p.name,
      }));
      setProfiles(profileOptions);

      // Set active profile as default
      const activeProfile = appService.profileManager.getActiveProfile();
      if (activeProfile) {
        setSelectedProfileId(activeProfile.id);
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError('');

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    // Validate profile selection
    if (!selectedProfileId) {
      setError('Please select a profile');
      return;
    }

    // Validate custom password if enabled
    if (useCustomPassword && !customPassword) {
      setError('Please enter a custom password');
      return;
    }

    // Validate redirect URL if action is redirect
    if (action === 'redirect' && !redirectUrl.trim()) {
      setError('Please enter a redirect URL');
      return;
    }

    // Hash custom password if provided
    let customPasswordHash: string | undefined;
    if (useCustomPassword && customPassword) {
      customPasswordHash = await appService.passwordService.hashPassword(customPassword);
    }

    // Prepare rule options
    const lockOptions =
      action === 'lock'
        ? {
            unlockDuration: Number(unlockDuration) as UnlockDuration,
            useCustomPassword,
            customPasswordHash,
          }
        : undefined;

    const redirectOptions =
      action === 'redirect'
        ? {
            targetUrl: redirectUrl,
          }
        : undefined;

    // Create rule
    const result = await appService.ruleManager.createRule(url, action, {
      profileId: selectedProfileId,
      lockOptions,
      redirectOptions,
    });

    if (!result.success) {
      setError(result.error || 'Failed to create rule');
      return;
    }

    // Success - call onSave callback and close
    onSave?.();
    handleClose();
  };

  const handleClose = () => {
    setUrl('');
    setAction('lock');
    setUnlockDuration('5');
    setUseCustomPassword(false);
    setCustomPassword('');
    setRedirectUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Link"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Link
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-accent-danger bg-opacity-10 border border-accent-danger rounded-btn">
            <p className="text-sm text-accent-danger">{error}</p>
          </div>
        )}

        <Input
          type="text"
          label="Website URL"
          value={url}
          onChange={setUrl}
          placeholder="example.com or *.example.com"
        />

        <Select
          label="Profile"
          options={profiles}
          value={selectedProfileId}
          onChange={setSelectedProfileId}
        />

        <Select
          label="Action"
          options={[
            { value: 'lock', label: 'Lock - Require password to access' },
            { value: 'block', label: 'Block - Completely block access' },
            { value: 'redirect', label: 'Redirect - Send to another URL' },
          ]}
          value={action}
          onChange={(value) => setAction(value as RuleAction)}
        />

        <Toggle
          checked={useCustomPassword}
          onChange={setUseCustomPassword}
          label="Use custom password"
          description="Set a different password for this link instead of using master password"
        />

        {useCustomPassword && (
          <div className="animate-slideUp">
            <Input
              type="password"
              label="Custom Password"
              value={customPassword}
              onChange={setCustomPassword}
              placeholder="Enter custom password"
            />
          </div>
        )}

        {action === 'lock' && (
          <div className="space-y-4 animate-slideUp pt-4 border-t border-border">
            <Select
              label="Unlock Duration"
              options={[
                { value: '1', label: '1 minute' },
                { value: '5', label: '5 minutes' },
                { value: '10', label: '10 minutes' },
                { value: '30', label: '30 minutes' },
              ]}
              value={unlockDuration}
              onChange={setUnlockDuration}
            />
          </div>
        )}

        {action === 'redirect' && (
          <div className="animate-slideUp pt-4 border-t border-border">
            <Input
              type="text"
              label="Redirect URL"
              value={redirectUrl}
              onChange={setRedirectUrl}
              placeholder="https://example.com/redirect"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
