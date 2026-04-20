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

import { useVenueStream } from './hooks/useVenueStream';

/**
 * SmartVenue AI - Production Dashboard Root Component.
 * Orchestrates the venue digital twin with real-time stream processing
 * and ML-driven spatial intelligence.
 */
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">Smart<span>Venue</span> AI</div>
          <div className="auth-title">Production Venue Intelligence Platform</div>
          <p className="auth-subtitle">
            Predict crowd flow, manage wait times, and interact with venue digital twins using Gemini Spatial Intelligence.
          </p>
          <button className="google-login-btn" onClick={handleLogin}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="google-icon" />
            Sign in with Google
          </button>
          <p className="auth-footer">
            &copy; 2026 HITEX Exhibition Center &bull; Powered by Google Cloud
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header role="banner">
        <div className="logo">Smart<span>Venue</span> AI</div>
        
        <div className="header-meta">
          <SimulatorConsole 
            sessionToken={session.access_token} 
            onRefresh={() => setRefreshTrigger(Date.now())} 
          />
          
          <div className="user-profile" title={session.user.email}>
            <img 
              src={session.user.user_metadata.avatar_url} 
              alt={session.user.email} 
              className="user-avatar" 
            />
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </div>
          
          <span className="match-phase" id="match-phase" aria-live="polite">
            {snapshot ? snapshot.match_phase.toUpperCase() : 'LOADING…'}
          </span>
          <span className={`live-dot ${wsConnected ? 'active' : ''}`} aria-label="Live data status">
            {wsConnected ? 'LIVE' : 'SYNCING…'}
          </span>
        </div>
      </header>

      <main id="main-content" role="main">
        <HeatmapSection 
          snapshot={snapshot} 
          onZoneClick={handleZoneClick} 
        />
        <WaitTimesSection 
          zones={snapshot ? snapshot.zones : []} 
        />
        <GraphSection 
          onZoneClick={handleZoneClick} 
          refreshTrigger={refreshTrigger} 
          sessionToken={session.access_token} 
        />
        <MapSection 
          zones={snapshot ? snapshot.zones : []} 
          particles={snapshot?.particles} 
        />
        <FloorplansGallery />
      </main>

      <ChatWidget sessionToken={session.access_token} />
    </>
  );
}

export default App;

export default App;
