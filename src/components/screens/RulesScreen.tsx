export function RulesScreen() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Rules</h1>
        <p className="text-gray-400 mt-2">
          Manage link lock, block, and redirect rules for the active profile
        </p>
      </div>

      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Rules Management Coming Soon
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create rules to lock, block, or redirect specific websites for the
          active profile.
        </p>
      </div>
    </div>
  );
}
