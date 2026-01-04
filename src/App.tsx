import { useState } from 'react';
import { UnlockPage, OptionsPage, WelcomePage } from './ui/pages';
import { Button } from './ui/components/common';

type Page = 'welcome' | 'unlock' | 'options';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('welcome');

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage />;
      case 'unlock':
        return <UnlockPage />;
      case 'options':
        return <OptionsPage />;
      default:
        return <WelcomePage />;
    }
  };

  return (
    <div className="relative">
      {/* Demo Navigation - Top Right */}
      <div className="fixed top-4 right-4 z-50 bg-bg-secondary border border-border rounded-btn p-3 shadow-lg">
        <p className="text-xs text-text-muted mb-2">Demo Navigation</p>
        <div className="flex flex-col gap-2">
          <Button
            variant={currentPage === 'welcome' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentPage('welcome')}
          >
            Welcome
          </Button>
          <Button
            variant={currentPage === 'unlock' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentPage('unlock')}
          >
            Unlock
          </Button>
          <Button
            variant={currentPage === 'options' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentPage('options')}
          >
            Options
          </Button>
        </div>
      </div>

      {/* Current Page */}
      {renderPage()}
    </div>
  );
}

export default App;
