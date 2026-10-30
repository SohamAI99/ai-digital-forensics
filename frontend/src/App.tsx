import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { EmailForensics } from './pages/EmailForensics';
import { ImageForensics } from './pages/ImageForensics';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { HealthStatus } from './types';
import { fetchHealth } from './services/api';

function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const renderPage = () => {
    switch (currentTab) {
      case 'overview':
        return <Overview onNavigate={setCurrentTab} />;
      case 'email':
        return <EmailForensics />;
      case 'image':
        return <ImageForensics />;
      case 'history':
        return <HistoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Overview onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-theme-app text-theme-main theme-transition">
      {/* Persistent Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        systemHealthy={health?.status === 'healthy'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          health={health}
          onRefresh={loadHealth}
          isRefreshing={isRefreshing}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
