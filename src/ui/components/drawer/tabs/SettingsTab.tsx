import { Card, Button, Toggle, Select } from '../../common';

export const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Settings</h2>

      {/* Master Password */}
      <Card title="Master Password" padding="md">
        <p className="text-sm text-text-secondary mb-4">
          Requires entering current password
        </p>
        <Button variant="secondary">Change Master Password</Button>
      </Card>

      {/* Security */}
      <Card title="Security" padding="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Failed Attempt Limit
            </label>
            <Select
              options={[
                { value: '3', label: '3 attempts' },
                { value: '5', label: '5 attempts' },
                { value: '10', label: '10 attempts' },
              ]}
              value="5"
              onChange={() => {}}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Cooldown Duration
            </label>
            <Select
              options={[
                { value: '1', label: '1 minute' },
                { value: '5', label: '5 minutes' },
                { value: '10', label: '10 minutes' },
                { value: '30', label: '30 minutes' },
              ]}
              value="5"
              onChange={() => {}}
            />
          </div>

          <Toggle
            checked={false}
            onChange={() => {}}
            label="Require master password after cooldown"
          />
        </div>
      </Card>

      {/* Activity Logging */}
      <Card title="Activity Logging" padding="md">
        <div className="space-y-3">
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Track unlock events"
          />
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Track failed attempts"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Track redirect events"
          />
          <div className="pt-4">
            <Button variant="danger">Clear All Logs</Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" padding="md">
        <p className="text-sm text-text-secondary mb-4">
          Removes all rules, profiles, and data
        </p>
        <Button variant="danger">Reset All Settings</Button>
      </Card>
    </div>
  );
};
