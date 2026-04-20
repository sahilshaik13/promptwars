import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Offline/Error Page
 * Displayed when the user loses internet connection or a critical error occurs
 */
export const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to home after coming back online
      window.location.href = '/';
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    
    // Attempt to reload the page
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <div 
      className="claymorphism-mode"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f4f6f8 0%, #e9ecef 100%)',
      }}
    >
      <div 
        className="clay-card"
        style={{
          maxWidth: '550px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2rem',
        }}
      >
        {!isOnline ? (
          <>
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }} aria-hidden="true">
              📡
            </div>
            
            <h1 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#212529',
                marginBottom: '0.5rem',
              }}
            >
              You're Offline
            </h1>
            
            <p 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.125rem',
                color: '#495057',
                marginBottom: '0.5rem',
              }}
            >
              No internet connection detected
            </p>
            
            <p 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                color: '#6c757d',
                marginBottom: '2rem',
                lineHeight: 1.6,
              }}
            >
              Please check your network connection and try again. 
              Some cached content may still be available.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '6rem', marginBottom: '1rem' }} aria-hidden="true">
              ⚠️
            </div>
            
            <h1 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#212529',
                marginBottom: '0.5rem',
              }}
            >
              Something Went Wrong
            </h1>
            
            <p 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.125rem',
                color: '#495057',
                marginBottom: '0.5rem',
              }}
            >
              Unexpected error occurred
            </p>
            
            <p 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                color: '#6c757d',
                marginBottom: '2rem',
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected error. Please try again or clear your cache if the problem persists.
            </p>
          </>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRetry}
            disabled={!isOnline}
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: isOnline ? 'linear-gradient(145deg, #9c27b0, #7b1fa2)' : '#e9ecef',
              color: isOnline ? 'white' : '#adb5bd',
              border: 'none',
              borderRadius: '12px',
              cursor: isOnline ? 'pointer' : 'not-allowed',
              boxShadow: isOnline ? '0 4px 12px rgba(156, 39, 176, 0.3)' : 'none',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={(e) => {
              if (isOnline) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(156, 39, 176, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (isOnline) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)';
              }
            }}
          >
            {retryCount > 0 ? '🔄 Try Again' : '🔄 Retry'}
          </button>
          
          <button
            onClick={handleClearCache}
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: '#f8f9fa',
              color: '#495057',
              border: '2px solid #dee2e6',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#f8f9fa';
            }}
          >
            🗑️ Clear Cache
          </button>
          
          <Link 
            to="/"
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: '#e9ecef',
              color: '#495057',
              border: '2px solid #dee2e6',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#e9ecef';
            }}
          >
            🏠 Go Home
          </Link>
        </div>
        
        {retryCount >= 3 && (
          <div 
            style={{ 
              marginTop: '2rem',
              padding: '1rem',
              background: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#e65100',
            }}
            role="alert"
          >
            <strong>Having trouble?</strong> Try clearing your browser cache or contacting support if the problem persists.
          </div>
        )}
        
        <div 
          style={{ 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: '#adb5bd', fontFamily: 'JetBrains Mono, monospace' }}>
            Error Code: {isOnline ? 'ERR_SERVER' : 'ERR_OFFLINE'} • Attempt: {retryCount}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '0.5rem' }}>
            Timestamp: {new Date().toISOString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;