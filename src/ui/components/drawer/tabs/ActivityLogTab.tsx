import { useState } from 'react';
import { Unlock, XCircle, ArrowRight, Trash2 } from 'lucide-react';
import { Card, Button, Select } from '../../common';

interface ActivityLog {
  id: string;
  type: 'unlock' | 'failed' | 'redirect';
  domain: string;
  timestamp: string;
  details?: string;
}

// Mock data
const mockLogs: ActivityLog[] = [
  {
    id: '1',
    type: 'unlock',
    domain: 'example.com',
    timestamp: '2:45 PM',
    details: 'Session unlock',
  },
  {
    id: '2',
    type: 'failed',
    domain: 'youtube.com',
    timestamp: '2:30 PM',
    details: 'Wrong password (3 attempts)',
  },
  {
    id: '3',
    type: 'redirect',
    domain: 'twitter.com',
    timestamp: '1:15 PM',
    details: '→ focus-mode.html',
  },
];

export const ActivityLogTab = () => {
  const [logs] = useState<ActivityLog[]>(mockLogs);
  const [filter, setFilter] = useState('all');

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'unlock':
        return <Unlock className="w-5 h-5 text-accent-success" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-accent-danger" />;
      case 'redirect':
        return <ArrowRight className="w-5 h-5 text-accent-warning" />;
      default:
        return null;
    }
  };

  const getLogTitle = (log: ActivityLog) => {
    switch (log.type) {
      case 'unlock':
        return `${log.domain} unlocked`;
      case 'failed':
        return `${log.domain} failed`;
      case 'redirect':
        return `${log.domain} redirected`;
      default:
        return log.domain;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Activity Log</h2>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Clear All
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          options={[
            { value: 'all', label: 'All Events' },
            { value: 'unlock', label: 'Unlocks' },
            { value: 'failed', label: 'Failed Attempts' },
            { value: 'redirect', label: 'Redirects' },
          ]}
          value={filter}
          onChange={setFilter}
          placeholder="Filter by type"
        />
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} padding="md">
            <div className="flex items-start gap-3">
              {getLogIcon(log.type)}
              <div className="flex-1">
                <h3 className="font-medium text-text-primary">
                  {getLogTitle(log)}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {log.timestamp}
                  {log.details && ` • ${log.details}`}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <p>No activity logs</p>
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <Button variant="secondary" size="sm">
          Load More
        </Button>
      </div>
    </div>
  );
};
