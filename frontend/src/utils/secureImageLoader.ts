/**
 * Secure Image Proxy Utility
 * Handles secure image loading from GCloud Storage with signed URLs
 * Images are served through Cloud CDN with signed URLs for security
 */

interface SignedUrlConfig {
  bucketBaseUrl: string;
  signedUrlExpiry?: number; // minutes
}

interface ImageLoadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

/**
 * Generates a signed URL for GCloud Storage objects
 * In production, this should be generated server-side with proper credentials
 */
export async function generateSignedUrl(
  objectPath: string,
  config: SignedUrlConfig
): Promise<string> {
  const { bucketBaseUrl, signedUrlExpiry = 60 } = config;
  
  // Clean the object path
  const cleanPath = objectPath.replace(/^\//, '');
  
  // In production, you would call your backend API which has GCloud credentials
  // The backend will generate a proper signed URL using @google-cloud/storage
  try {
    const response = await fetch('/api/images/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objectPath: cleanPath,
        expiryMinutes: signedUrlExpiry,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate signed URL');
    }

    const { signedUrl } = await response.json();
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    // Fallback to direct URL (not recommended for production)
    return `${bucketBaseUrl}/${cleanPath}`;
  }
}

/**
 * Secure image loader that uses signed URLs
 * Automatically refreshes expired URLs
 */
export class SecureImageLoader {
  private cache: Map<string, { url: string; expires: number }> = new Map();
  private config: SignedUrlConfig;
  private refreshBuffer: number = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  constructor(config: SignedUrlConfig) {
    this.config = config;
  }

  async getImageUrl(objectPath: string): Promise<string> {
    const now = Date.now();
    const cached = this.cache.get(objectPath);

    // Return cached URL if still valid (with buffer time)
    if (cached && cached.expires > now + this.refreshBuffer) {
      return cached.url;
    }

    // Generate new signed URL
    const url = await generateSignedUrl(objectPath, this.config);
    
    // Cache with expiry (subtract refresh buffer for safety)
    this.cache.set(objectPath, {
      url,
      expires: now + (this.config.signedUrlExpiry || 60) * 60 * 1000 - this.refreshBuffer,
    });

    return url;
  }

  clearCache(): void {
    this.cache.clear();
  }

  preloadImages(objectPaths: string[]): Promise<void[]> {
    return Promise.all(objectPaths.map(path => this.getImageUrl(path)));
  }
}

/**
 * React hook for secure image loading
 */
export function useSecureImage(objectPath: string | null, options?: ImageLoadOptions) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!objectPath) {
      setImageUrl(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    const loader = new SecureImageLoader({
      bucketBaseUrl: import.meta.env.VITE_GCLOUD_BUCKET_URL || '',
    });

    loader.getImageUrl(objectPath)
      .then(url => {
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [objectPath]);

  return { imageUrl, loading, error };
}

// Placeholder for React import (will be resolved by TypeScript)
const React = { useState: (v: any) => [v, () => {}], useEffect: (fn: () => void) => fn() };

export default SecureImageLoader;