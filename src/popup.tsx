/**
 * Extension Popup - Complete Implementation
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Lock, Unlock, Settings, Shield, Clock } from 'lucide-react';
import { sendMessage } from './core/messages';

function Popup() {
  const [currentDomain, setCurrentDomain] = React.useState<string>('');
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [isSnoozed, setIsSnoozed] = React.useState(false);
  const [unlockEndsAt, setUnlockEndsAt] = React.useState<number>();
  const [hasRule, setHasRule] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCurrentTab();
  }, []);

  const loadCurrentTab = async () => {
    try {
      const tabs = await (window as any).chrome?.tabs?.query({ active: true, currentWindow: true }) ||
                    await (window as any).browser?.tabs?.query({ active: true, currentWindow: true });

      if (tabs && tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        setCurrentDomain(domain);

        // Check if there's a rule for this domain
        const rulesResponse = await sendMessage('GET_RULES', {});
        if (rulesResponse.success && rulesResponse.rules) {
          const matchingRule = rulesResponse.rules.find((r: any) =>
            r.urlPattern === domain || 
            (r.urlPattern.startsWith('*.') && domain.endsWith(r.urlPattern.substring(2)))
          );
          setHasRule(!!matchingRule);
        }

        // Get unlock status
        const status = await sendMessage('GET_UNLOCK_STATUS', { domain });
        setIsUnlocked(status.isUnlocked);
        setIsSnoozed(status.isSnoozed || status.mode === 'snooze');
        setUnlockEndsAt(status.unlockEndsAt);
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (isUnlocked) {
      await sendMessage('LOCK_DOMAIN', { domain: currentDomain });
      setIsUnlocked(false);
      setIsSnoozed(false);
    }
  };

  const handleOpenOptions = () => {
    if ((window as any).chrome?.runtime) {
      (window as any).chrome.runtime.openOptionsPage();
    } else if ((window as any).browser?.runtime) {
      (window as any).browser.runtime.openOptionsPage();
    }
  };

  const getRemainingTime = () => {
    if (!unlockEndsAt) return '';
    const remaining = unlockEndsAt - Date.now();
    if (remaining <= 0) return '';
    
    const minutes = Math.floor(remaining / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (loading) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">LinkLock</h1>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Current Site</div>
        <div className="font-medium text-gray-900 truncate">{currentDomain || 'No site detected'}</div>
      </div>

      {currentDomain && (
        <>
          <div className="mb-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isUnlocked ? 'bg-green-50 text-green-700' :
              isSnoozed ? 'bg-yellow-50 text-yellow-700' :
              hasRule ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {isUnlocked ? (
                <>
                  <Unlock className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">Unlocked</div>
                    {getRemainingTime() && (
                      <div className="text-xs flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {getRemainingTime()} remaining
                      </div>
                    )}
                  </div>
                </>
              ) : isSnoozed ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Snoozed</span>
                </>
              ) : hasRule ? (
                <>
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Protected</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Not Protected</span>
                </>
              )}
            </div>

            {isUnlocked && (
              <button
                onClick={handleLockToggle}
                className="mt-2 w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Lock Now
              </button>
            )}

            {!hasRule && !isUnlocked && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                This site is not protected. Add a rule to lock it.
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleOpenOptions}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Open Settings
      </button>

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        Privacy-first website protection
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Popup /></React.StrictMode>);
