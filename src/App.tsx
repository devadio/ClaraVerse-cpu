import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { db } from './db';
import { ProvidersProvider } from './contexts/ProvidersContext';
import { ArtifactPaneProvider } from './contexts/ArtifactPaneContext';
import { StartupService } from './services/startupService';
import { initializeUIPreferences, applyUIPreferences } from './utils/uiPreferences';

// Lazy load all page components to reduce initial bundle size
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));
const Debug = lazy(() => import('./components/Debug'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const ImageGen = lazy(() => import('./components/ImageGen'));
const Gallery = lazy(() => import('./components/Gallery'));
const Help = lazy(() => import('./components/Help'));
const N8N = lazy(() => import('./components/N8N'));
const Servers = lazy(() => import('./components/Servers'));
const AgentStudio = lazy(() => import('./components/AgentStudio'));
const AgentManager = lazy(() => import('./components/AgentManager'));
const AgentRunnerSDK = lazy(() => import('./components/AgentRunnerSDK'));
const Lumaui = lazy(() => import('./components/Lumaui'));
const LumaUILite = lazy(() => import('./components/LumaUILite'));
const Notebooks = lazy(() => import('./components/Notebooks'));
const Tasks = lazy(() => import('./components/Tasks'));
const Community = lazy(() => import('./components/Community'));
const ClaraAssistant = lazy(() => import('./components/ClaraAssistant'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-sakura-100 dark:from-gray-900 dark:to-sakura-100">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-sakura-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const [activePage, setActivePage] = useState(() => localStorage.getItem('activePage') || 'dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string } | null>(null);
  const [alphaFeaturesEnabled, setAlphaFeaturesEnabled] = useState(false);
  const [agentMode, setAgentMode] = useState<'manager' | 'studio' | 'runner'>('manager');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  // Track Clara's processing state to keep it mounted when active
  const [isClaraProcessing, setIsClaraProcessing] = useState(false);

  useEffect(() => {
    const checkUserInfo = async () => {
      const info = await db.getPersonalInfo();
      if (!info || !info.name) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
        setUserInfo({ name: info.name });
      }
      
      // Initialize and apply UI preferences
      initializeUIPreferences();
      applyUIPreferences(info);
    };
    checkUserInfo();
    
    // Add db to window for debugging in development
    if (import.meta.env.DEV) {
      (window as typeof window & { db: typeof db }).db = db;
    }
  }, []);

  useEffect(() => {
    db.getAlphaFeaturesEnabled?.().then(val => setAlphaFeaturesEnabled(!!val));
  }, []);

  useEffect(() => {
    // Apply startup settings
    StartupService.getInstance().applyStartupSettings();
  }, []);

  // Trigger MCP servers restoration on app startup
  useEffect(() => {
    const restoreMCPServers = async () => {
      if (window.mcpService && !showOnboarding) {
        try {
          console.log('App ready - attempting to restore MCP servers...');
          const results = await window.mcpService.startPreviouslyRunning();
          const successCount = results.filter((r: { success: boolean }) => r.success).length;
          const totalCount = results.length;
          
          if (totalCount > 0) {
            console.log(`MCP restoration: ${successCount}/${totalCount} servers restored`);
          } else {
            console.log('MCP restoration: No servers to restore');
          }
        } catch (error) {
          console.error('Error restoring MCP servers:', error);
        }
      }
    };

    // Delay restoration slightly to ensure app is fully initialized
    const timeoutId = setTimeout(restoreMCPServers, 2000);
    return () => clearTimeout(timeoutId);
  }, [showOnboarding]);

  // Listen for global shortcut trigger to navigate to Clara chat
  useEffect(() => {
    let lastTriggerTime = 0;
    const debounceDelay = 300; // 300ms debounce
    
    const handleGlobalClaraShortcut = () => {
      const now = Date.now();
      
      // Check if we're within the debounce period
      if (now - lastTriggerTime < debounceDelay) {
        console.log('Global shortcut navigation debounced - too soon after last trigger');
        return;
      }
      
      lastTriggerTime = now;
      console.log('Global shortcut triggered - navigating to Clara chat');
      setActivePage('clara');
    };

    // Add listener for the trigger-new-chat event
    if (window.electron && window.electron.receive) {
      window.electron.receive('trigger-new-chat', handleGlobalClaraShortcut);
    }

    // Cleanup listener on unmount
    return () => {
      if (window.electron && window.electron.removeListener) {
        window.electron.removeListener('trigger-new-chat', handleGlobalClaraShortcut);
      }
    };
  }, []);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    const info = await db.getPersonalInfo();
    if (info) {
      setUserInfo({ name: info.name });
    }
  };

  useEffect(() => {
    console.log('Storing activePage:', activePage);
    localStorage.setItem('activePage', activePage);
    
    // Reset agent mode when navigating away from agents page
    if (activePage !== 'agents') {
      setAgentMode('manager');
      setEditingAgentId(null);
    }
  }, [activePage]);

  const renderContent = () => {
    if (activePage === 'assistant') {
      return (
        <Suspense fallback={<PageLoader />}>
          <ClaraAssistant onPageChange={setActivePage} />
        </Suspense>
      );
    }

    // Clara is now always mounted but conditionally visible
    // This allows it to run in the background

    if (activePage === 'agents') {
      const handleEditAgent = (agentId: string) => {
        setEditingAgentId(agentId);
        setAgentMode('studio');
      };

      const handleOpenAgent = (agentId: string) => {
        setRunningAgentId(agentId);
        setAgentMode('runner');
      };

      const handleCreateAgent = () => {
        setEditingAgentId(null);
        setAgentMode('studio');
      };

      const handleBackToManager = () => {
        setAgentMode('manager');
        setEditingAgentId(null);
        setRunningAgentId(null);
      };

      if (agentMode === 'manager') {
        return (
          <Suspense fallback={<PageLoader />}>
            <AgentManager
              onPageChange={setActivePage}
              onEditAgent={handleEditAgent}
              onOpenAgent={handleOpenAgent}
              onCreateAgent={handleCreateAgent}
              userName={userInfo?.name}
            />
          </Suspense>
        );
      } else if (agentMode === 'studio') {
        return (
          <Suspense fallback={<PageLoader />}>
            <AgentStudio
              onPageChange={handleBackToManager}
              userName={userInfo?.name}
              editingAgentId={editingAgentId}
            />
          </Suspense>
        );
      } else if (agentMode === 'runner' && runningAgentId) {
        return (
          <Suspense fallback={<PageLoader />}>
            <AgentRunnerSDK
              agentId={runningAgentId}
              onClose={handleBackToManager}
            />
          </Suspense>
        );
      }
    }



    if (activePage === 'image-gen') {
      return (
        <Suspense fallback={<PageLoader />}>
          <ImageGen onPageChange={setActivePage} />
        </Suspense>
      );
    }

    if (activePage === 'gallery') {
      return (
        <Suspense fallback={<PageLoader />}>
          <Gallery onPageChange={setActivePage} />
        </Suspense>
      );
    }

    if (activePage === 'n8n') {
      return (
        <Suspense fallback={<PageLoader />}>
          <N8N onPageChange={setActivePage} />
        </Suspense>
      );
    }

    if (activePage === 'servers') {
      return (
        <Suspense fallback={<PageLoader />}>
          <Servers onPageChange={setActivePage} />
        </Suspense>
      );
    }

    return (
      <div className="flex h-screen">
        <Sidebar activePage={activePage} onPageChange={setActivePage} alphaFeaturesEnabled={alphaFeaturesEnabled} />

        <div className="flex-1 flex flex-col">
          <Topbar userName={userInfo?.name} onPageChange={setActivePage} />

          <main className="">
            <Suspense fallback={<PageLoader />}>
              {(() => {
                switch (activePage) {
                  case 'tasks':
                    return <Tasks onPageChange={setActivePage} />;
                  case 'community':
                    return <Community onPageChange={setActivePage} />;
                  case 'settings':
                    return <Settings />;
                  case 'debug':
                    return <Debug />;
                  case 'help':
                    return <Help />;
                  case 'notebooks':
                    return <Notebooks onPageChange={setActivePage} userName={userInfo?.name} />;
                  case 'lumaui':
                    return <Lumaui />;
                  case 'lumaui-lite':
                    return <LumaUILite />;
                  case 'dashboard':
                  default:
                    return <Dashboard onPageChange={setActivePage} />;
                }
              })()}
            </Suspense>
          </main>
        </div>
      </div>
    );
  };

  return (
    <ProvidersProvider>
      <ArtifactPaneProvider>
        <div className="min-h-screen bg-gradient-to-br from-white to-sakura-100 dark:from-gray-900 dark:to-sakura-100">
          {showOnboarding ? (
            <Suspense fallback={<PageLoader />}>
              <Onboarding onComplete={handleOnboardingComplete} />
            </Suspense>
          ) : (
            <>
              {/* Smart rendering: Keep Clara mounted when processing, unmount when idle */}
              {(activePage === 'clara' || isClaraProcessing) && (
                <div
                  className={activePage === 'clara' ? 'block' : 'hidden'}
                  data-clara-container
                >
                  <Suspense fallback={<PageLoader />}>
                    <ClaraAssistant
                      onPageChange={setActivePage}
                      onProcessingChange={setIsClaraProcessing}
                    />
                  </Suspense>
                </div>
              )}

              {/* Render other content when not on Clara page */}
              {activePage !== 'clara' && renderContent()}

              {/* Background processing indicator */}
              {isClaraProcessing && activePage !== 'clara' && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-sakura-500 text-white rounded-full shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-sm font-medium">Clara is processing in background...</span>
                </div>
              )}
            </>
          )}
        </div>
      </ArtifactPaneProvider>
    </ProvidersProvider>
  );
}

export default App;


