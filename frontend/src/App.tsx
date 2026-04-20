import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

import { HeatmapSection } from './components/HeatmapSection';
import { WaitTimesSection } from './components/WaitTimesSection';
import { GraphSection } from './components/GraphSection';
import { MapSection } from './components/MapSection';
import { ChatWidget } from './components/ChatWidget';
import { FloorplansGallery } from './components/FloorplansGallery';
import { SimulatorConsole } from './components/SimulatorConsole';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useVenueStream } from './hooks/useVenueStream';

/**
 * SmartVenue AI - Claymorphism Design
 * Modern, friendly interface with soft shadows and colorful status indicators
 */
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  // Authenticated initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Real-time synchronization engine
  const { 
    snapshot, 
    wsConnected, 
    refreshTrigger, 
    setRefreshTrigger 
  } = useVenueStream(session?.access_token);

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const handleZoneClick = (zoneName: string, status: string) => {
    console.log(`Focusing zone: ${zoneName} (${status})`);
  };

  if (loading) {
    return (
      <div className="claymorphism-mode">
        <div className="auth-container">
          <div className="auth-card clay-card">
            <div className="clay-title" role="status" aria-live="polite">Loading...</div>
            <div className="clay-text" aria-hidden="true">Initializing SmartVenue AI...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="claymorphism-mode">
        <div className="auth-container">
          <div className="auth-card clay-card" role="main" aria-labelledby="auth-title">
            <h1 id="auth-title" className="clay-title">SmartVenue AI</h1>
            <p className="clay-subtitle" aria-describedby="auth-subtitle">Venue Intelligence Platform</p>
            <p id="auth-subtitle" className="clay-text clay-mb-lg">
              Predict crowd flow, manage wait times, and interact with venue digital twins using Gemini Spatial Intelligence.
            </p>
            <button 
              className="clay-button primary clay-mb-md" 
              onClick={handleLogin}
              aria-label="Sign in to access SmartVenue AI"
            >
              Get Started
            </button>
            <div className="clay-status" role="status" aria-label="Powered by">
              Powered by Gemini Spatial Intelligence
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="claymorphism-mode">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <header role="banner" className="clay-header" aria-label="Main navigation">
          <h2 className="clay-logo" aria-label="SmartVenue AI">
            Smart<span>Venue</span> AI
          </h2>
          
          <nav className="header-meta clay-nav" role="navigation" aria-label="User controls">
            <ErrorBoundary>
              <SimulatorConsole 
                sessionToken={session.access_token} 
                onRefresh={() => setRefreshTrigger(Date.now())} 
              />
            </ErrorBoundary>
            
            <div className="user-profile" title={`Logged in as ${session.user.email}`}>
              <img 
                src={session.user.user_metadata.avatar_url} 
                alt={`${session.user.email}'s profile picture`}
                className="user-avatar"
                loading="lazy"
                width="32"
                height="32"
              />
              <button 
                className="btn-logout" 
                onClick={handleLogout}
                aria-label="Log out of SmartVenue AI"
              >
                Log out
              </button>
            </div>
            
            <span 
              className="match-phase clay-nav-item" 
              id="match-phase" 
              role="status" 
              aria-live="polite"
              aria-label={`Current event phase: ${snapshot ? snapshot.match_phase : 'loading'}`}
            >
              {snapshot ? snapshot.match_phase.toUpperCase() : 'LOADING…'}
            </span>
            <span 
              className={`live-dot ${wsConnected ? 'active' : ''} clay-status live`}
              role="status"
              aria-live="polite"
              aria-label={wsConnected ? 'Live data stream active' : 'Data stream syncing'}
            >
              {wsConnected ? 'LIVE' : 'SYNCING…'}
            </span>
          </nav>
        </header>

        <main id="main-content" role="main" aria-label="Venue intelligence dashboard">
          <ErrorBoundary>
            <HeatmapSection 
              snapshot={snapshot} 
              onZoneClick={handleZoneClick} 
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <WaitTimesSection 
              zones={snapshot ? snapshot.zones : []} 
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <GraphSection 
              onZoneClick={handleZoneClick} 
              refreshTrigger={refreshTrigger} 
              sessionToken={session.access_token} 
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <MapSection 
              zones={snapshot ? snapshot.zones : []} 
              particles={snapshot?.particles} 
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <FloorplansGallery />
          </ErrorBoundary>
        </main>

        <ErrorBoundary>
          <ChatWidget sessionToken={session.access_token} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default App;