/**
 * Unlock Page - Complete Implementation
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Lock, AlertCircle, Ban, Clock } from 'lucide-react';
import { sendMessage } from './core/messages';

function UnlockPage() {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [domain, setDomain] = React.useState('');
  const [targetUrl, setTargetUrl] = React.useState('');
  const [ruleId, setRuleId] = React.useState('');
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [showSnooze, setShowSnooze] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    const domainParam = params.get('domain');
    const ruleIdParam = params.get('ruleId');
    const blockedParam = params.get('blocked');

    if (blockedParam === 'true') {
      setIsBlocked(true);
      setDomain(domainParam || '');
      return;
    }

    if (urlParam) setTargetUrl(urlParam);
    if (domainParam) setDomain(domainParam);
    if (ruleIdParam) setRuleId(ruleIdParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await sendMessage('UNLOCK_ATTEMPT', { domain, password, ruleId });

      if (response.success) {
        if (targetUrl) {
          window.location.href = decodeURIComponent(targetUrl);
        }
      } else {
        setError(response.error || 'Invalid password');
        setPassword('');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (durationMinutes: number) => {
    try {
      await sendMessage('SNOOZE_DOMAIN', { domain, durationMinutes });
      if (targetUrl) {
        window.location.href = decodeURIComponent(targetUrl);
      }
    } catch (error) {
      setError('Failed to snooze');
    }
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <Ban className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Site Blocked</h1>
          <p className="text-center text-gray-600 mb-6">
            Access to <span className="font-semibold">{domain}</span> is blocked
          </p>
          <button onClick={() => window.history.back()} className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Lock className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Site Locked</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter password to access <span className="font-semibold">{domain}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              disabled={loading}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <button type="submit" disabled={loading || !password} className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t">
          <button onClick={() => setShowSnooze(!showSnooze)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Clock className="w-4 h-4" />
            Snooze for a while
          </button>
          {showSnooze && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={() => handleSnooze(5)} className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">5 min</button>
              <button onClick={() => handleSnooze(30)} className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">30 min</button>
              <button onClick={() => handleSnooze(60)} className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">1 hour</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><UnlockPage /></React.StrictMode>);
