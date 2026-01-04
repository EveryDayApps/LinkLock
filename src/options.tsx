/**
 * Extension Options Page
 * Main settings and configuration UI
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Shield, Plus, Lock, Trash2, AlertCircle } from 'lucide-react';
import { sendMessage } from './core/messages';
import { AddRuleModal } from './ui/components/AddRuleModal';

function Options() {
  const [initialized, setInitialized] = React.useState(false);
  const [hasMasterPassword, setHasMasterPassword] = React.useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = React.useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = React.useState(false);
  const [masterPassword, setMasterPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [rules, setRules] = React.useState<any[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // Check initialization status
  React.useEffect(() => {
    checkInitialization();
    loadRules();
  }, []);

  const checkInitialization = async () => {
    try {
      const status = await sendMessage('INIT_CHECK', {});
      setHasMasterPassword(status.hasMasterPassword);
      setInitialized(status.initialized);

      if (!status.hasMasterPassword) {
        setShowSetPasswordModal(true);
      }
    } catch (err) {
      console.error('Failed to check initialization:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await sendMessage('GET_RULES', {});
      if (response.success) {
        setRules(response.rules || []);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  const handleSetMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (masterPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await sendMessage('SET_MASTER_PASSWORD', { password: masterPassword });

      if (response.success) {
        setHasMasterPassword(true);
        setInitialized(true);
        setShowSetPasswordModal(false);
        setMasterPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error || 'Failed to set master password');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      const response = await sendMessage('DELETE_RULE', { ruleId });
      if (response.success) {
        await loadRules();
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleAddRuleSuccess = () => {
    loadRules();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">LinkLock Settings</h1>
        </div>

        {!hasMasterPassword && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900">Master Password Required</div>
              <div className="text-sm text-yellow-700 mt-1">
                Set a master password to start using LinkLock
              </div>
            </div>
          </div>
        )}

        {/* Protected Sites Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Protected Sites</h2>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              disabled={!hasMasterPassword}
              className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">No rules yet</p>
              <p className="text-sm">Click "Add New Rule" to protect your first website</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rule.urlPattern}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Action: <span className="capitalize">{rule.action}</span>
                      {rule.action === 'lock' && rule.lockOptions && (
                        <span className="ml-2">
                          • {rule.lockOptions.useCustomPassword ? 'Custom Password' : 'Master Password'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started Section */}
        {hasMasterPassword && rules.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-3 text-gray-700">
              <p className="flex items-start gap-2">
                <span className="font-semibold text-green-600">✓</span>
                <span>Master password set successfully</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">→</span>
                <span>Click "Add New Rule" to protect your first website</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-gray-400">○</span>
                <span>Choose lock mode: Always Ask, Timed Unlock, or Session Unlock</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-gray-400">○</span>
                <span>Optionally set custom passwords for specific sites</span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          LinkLock v1.0.0 - Privacy-first website protection
        </div>
      </div>

      {/* Set Master Password Modal */}
      {showSetPasswordModal && !hasMasterPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Master Password</h2>
            <p className="text-gray-600 mb-6">
              Create a strong master password to protect your LinkLock settings. This password will be required to access locked websites.
            </p>

            <form onSubmit={handleSetMasterPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter master password"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Confirm password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Set Master Password
              </button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 Tip: Choose a password you'll remember but others can't guess. You'll need this to unlock protected websites.
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      <AddRuleModal
        isOpen={showAddRuleModal}
        onClose={() => setShowAddRuleModal(false)}
        onSuccess={handleAddRuleSuccess}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
