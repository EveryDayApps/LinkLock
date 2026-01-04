import { ExternalLink, Github, Lock } from "lucide-react";
import { Card } from "../../common";

export const InfoTab = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent-primary rounded-lg">
          <Lock className="w-8 h-8 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Link Lock</h2>
          <p className="text-text-secondary">Version 1.0.0</p>
        </div>
      </div>

      {/* Description */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          About Link Lock
        </h3>
        <p className="text-text-secondary leading-relaxed">
          A privacy-first, cross-browser extension that password protects
          websites with fine-grained control, profiles, and timed access. Take
          control of your browsing with powerful website management features.
        </p>
      </Card>

      {/* Features */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Features
        </h3>
        <ul className="space-y-3">
          {[
            "Password-protect any website",
            "Multiple profiles for different contexts",
            "Timed unlocks and session management",
            "Block or redirect websites",
            "Custom passwords per site",
            "Activity logging",
            "Import/Export configurations",
            "Privacy-first: All data stored locally",
          ].map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Links */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Links</h3>
        <div className="space-y-3">
          <a
            href="https://github.com/narayann7/LinkLock"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-text-secondary hover:text-accent-primary transition-smooth"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
            <ExternalLink className="w-4 h-4 ml-auto" />
          </a>
          <a
            href="https://github.com/narayann7/LinkLock/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-text-secondary hover:text-accent-primary transition-smooth"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Report an Issue</span>
            <ExternalLink className="w-4 h-4 ml-auto" />
          </a>
        </div>
      </Card>

      {/* Privacy Notice */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Privacy & Security
        </h3>
        <p className="text-text-secondary leading-relaxed text-sm">
          🔒 All passwords are hashed using SHA-256 and never stored in
          plaintext.
          <br />
          💾 All data is stored locally on your device - no cloud sync.
          <br />
          🔐 Your data is encrypted before storage.
          <br />
          👁️ No analytics, tracking, or remote data collection.
        </p>
      </Card>

      {/* License */}
      <div className="text-center text-text-muted text-sm">
        <p>Made with ❤️ by Narayan</p>
        <p className="mt-1">Licensed under MIT License</p>
      </div>
    </div>
  );
};
