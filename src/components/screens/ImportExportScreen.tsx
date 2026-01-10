export function ImportExportScreen() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Import / Export</h1>
        <p className="text-gray-400 mt-2">
          Backup and restore your profiles and rules
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Import / Export Coming Soon
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Export your profiles and rules to a file, or import from a backup.
        </p>
      </div>
    </div>
  );
}
