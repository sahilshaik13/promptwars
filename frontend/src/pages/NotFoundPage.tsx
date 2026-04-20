import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page
 * Displayed when user navigates to non-existent routes
 */
export const NotFoundPage: React.FC = () => {
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
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2rem',
        }}
      >
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }} aria-hidden="true">
          🚧
        </div>
        
        <h1 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '3rem',
            fontWeight: 700,
            color: '#212529',
            marginBottom: '0.5rem',
          }}
        >
          404
        </h1>
        
        <h2 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#495057',
            marginBottom: '1.5rem',
          }}
        >
          Page Not Found
        </h2>
        
        <p 
          style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            color: '#6c757d',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/"
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(145deg, #9c27b0, #7b1fa2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            🏠 Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
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
            ← Go Back
          </button>
        </div>
        
        <div 
          style={{ 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #dee2e6',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: '#adb5bd' }}>
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;