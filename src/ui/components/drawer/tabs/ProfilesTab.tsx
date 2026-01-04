import { useState } from 'react';
import { Plus, Circle, CheckCircle } from 'lucide-react';
import { Card, Button } from '../../common';

interface Profile {
  id: string;
  name: string;
  linkCount: number;
  isActive: boolean;
}

// Mock data
const mockProfiles: Profile[] = [
  { id: '1', name: 'Work', linkCount: 12, isActive: true },
  { id: '2', name: 'Focus', linkCount: 5, isActive: false },
  { id: '3', name: 'Kids', linkCount: 8, isActive: false },
];

export const ProfilesTab = () => {
  const [profiles] = useState<Profile[]>(mockProfiles);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Profiles</h2>
        <Button leftIcon={<Plus className="w-4 h-4" />}>New Profile</Button>
      </div>

      {/* Profiles List */}
      <div className="space-y-3">
        {profiles.map((profile) => (
          <Card key={profile.id} padding="md" hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {profile.isActive ? (
                  <CheckCircle className="w-5 h-5 text-accent-success" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted" />
                )}
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {profile.linkCount} links
                    {profile.isActive && ' • Active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!profile.isActive && (
                  <Button variant="secondary" size="sm">
                    Switch
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
