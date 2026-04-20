import React, { useState, useRef, useEffect } from 'react';
import { SecureImageLoader } from '../utils/secureImageLoader';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Secure Image Component
 * - Uses signed URLs from GCloud (hides bucket URLs from public)
 * - Lazy loads by default
 * - Shows loading skeleton
 * - Handles errors gracefully
 * - Optimized for Core Web Vitals
 */
export const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize secure image loader
  const loader = React.useMemo(() => {
    return new SecureImageLoader({
      bucketBaseUrl: import.meta.env.VITE_GCLOUD_BUCKET_URL || '',
      signedUrlExpiry: 60,
    });
  }, []);

  // Lazy load with Intersection Observer
  useEffect(() => {
    if (loading !== 'lazy' || !containerRef.current) {
      loadImage();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, loading]);

  const loadImage = async () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const url = await loader.getImageUrl(src);
      
      if (imgRef.current) {
        imgRef.current.src = url;
      } else {
        setImageUrl(url);
      }
    } catch (error) {
      console.error('Failed to load secure image:', error);
      setHasError(true);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error('Image failed to load'));
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width || '100%',
    height: height || 'auto',
    minHeight: height ? undefined : '100px',
    backgroundColor: '#f4f6f8',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  };

  const skeletonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  const errorStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#fff3e0',
    color: '#e65100',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.875rem',
  };

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      {isLoading && !hasError && <div style={skeletonStyle} aria-hidden="true" />}
      
      {hasError && (
        <div style={errorStyle} role="alert">
          <span aria-hidden="true">🖼️</span>
          <span>Image unavailable</span>
        </div>
      )}
      
      {!hasError && (
        <img
          ref={imgRef}
          src={imageUrl || src}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchpriority={loading === 'eager' ? 'high' : 'low'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            display: 'block',
          }}
        />
      )}
      
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
};

export default SecureImage;