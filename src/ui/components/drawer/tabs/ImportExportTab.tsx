import { Download, Upload } from 'lucide-react';
import { Card, Button, Toggle } from '../../common';

export const ImportExportTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Import / Export</h2>

      {/* Export */}
      <Card title="Export Configuration" padding="md">
        <div className="space-y-4">
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Include all profiles"
          />
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Include all rules"
          />
          <Toggle
            checked={false}
            onChange={() => {}}
            label="Include activity logs"
          />
          <div className="pt-2">
            <Button
              variant="primary"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export as Encrypted File
            </Button>
          </div>
        </div>
      </Card>

      {/* Import */}
      <Card title="Import Configuration" padding="md">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-btn p-8 text-center">
            <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-2">
              Choose file or drag & drop
            </p>
            <Button variant="secondary" size="sm">
              Choose File
            </Button>
          </div>

          <div className="bg-accent-warning bg-opacity-10 border border-accent-warning rounded-btn p-4">
            <p className="text-sm text-accent-warning">
              ⚠️ This will replace all current data
            </p>
          </div>

          <Button variant="primary" fullWidth>
            Import
          </Button>
        </div>
      </Card>
    </div>
  );
};
