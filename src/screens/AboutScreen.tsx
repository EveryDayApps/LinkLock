export function AboutScreen() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100">About Link Lock</h1>
        <p className="text-gray-400 mt-2">Version 1.0.0</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">
            What is Link Lock?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Link Lock is a browser extension that helps you manage your browsing
            experience by allowing you to lock, block, or redirect specific
            websites. Create different profiles for different contexts like Work,
            Focus, or Personal browsing.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Features</h2>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">✓</span>
              <span>Create and manage multiple profiles</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">✓</span>
              <span>Lock websites with password protection</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">✓</span>
              <span>Block distracting websites completely</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">✓</span>
              <span>Redirect URLs to alternative destinations</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">✓</span>
              <span>Encrypted local storage for security</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Privacy</h2>
          <p className="text-gray-400 leading-relaxed">
            All your data is stored locally on your device using AES-GCM
            encryption. We never send your data to external servers. Your
            profiles, rules, and settings remain completely private.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Support</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            Need help or found a bug?
          </p>
          <a
            href="https://github.com/narayann7/LinkLock"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition"
          >
            Visit our GitHub repository →
          </a>
        </div>

        <div className="text-center text-sm text-gray-500 pt-6">
          <p>Made with care for better browsing habits</p>
        </div>
      </div>
    </div>
  );
}
