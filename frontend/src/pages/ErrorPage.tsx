import React from 'react';
import { Link } from 'react-router-dom';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
  details?: string;
}

/**
 * Generic Error Page
 * Used for 500, 502, 503 and other server-side errors
 */
export const ErrorPage: React.FC<ErrorPageProps> = ({ 
  code = 500, 
  title = 'Server Error',
  message = 'We\'re experiencing technical difficulties. Our team has been notified.',
  details 
}) => {
  const getEmoji = () => {
    if (code === 500) return '🔧';
    if (code === 502) return '🔌';
    if (code === 503) return '⏰';
    if (code === 504) return '⏱️';
    return '⚠️';
  };

  const getDefaultMessage = () => {
    switch (code) {
      case 500: return 'Internal server error - we\'re working on it';
      case 502: return 'Bad gateway - connection issue detected';
      case 503: return 'Service temporarily unavailable - please try again later';
      case 504: return 'Gateway timeout - request took too long';
      default: return message;
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
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }} aria-hidden="true">
          {getEmoji()}
        </div>
        
        <div 
          style={{ 
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#9c27b0',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Error {code}
        </div>
        
        <h1 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '2rem',
            fontWeight: 700,
            color: '#212529',
            marginBottom: '1rem',
          }}
        >
          {title}
        </h1>
        
        <p 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            color: '#495057',
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          {getDefaultMessage()}
        </p>
        
        {details && (
          <details 
            style={{ 
              marginBottom: '1.5rem',
              textAlign: 'left',
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
              Technical Details
            </summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#6c757d' }}>
              {details}
            </pre>
          </details>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(145deg, #9c27b0, #7b1fa2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(156, 39, 176, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)';
            }}
          >
            🔄 Try Again
          </button>
          
          <Link 
            to="/"
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: '#f8f9fa',
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
              e.currentTarget.style.background = '#f8f9fa';
            }}
          >
            🏠 Go to Dashboard
          </Link>
        </div>
        
        <div 
          style={{ 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: '#adb5bd' }}>
            If this problem persists, please contact our support team.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#adb5bd', marginTop: '0.25rem', fontFamily: 'JetBrains Mono, monospace' }}>
            Error ID: {Date.now().toString(36).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;