/**
 * Secure Image Proxy Utility
 * Handles secure image loading from GCloud Storage with signed URLs
 * Images are served through Cloud CDN with signed URLs for security
 */

import { useState, useEffect } from 'react';

interface SignedUrlConfig {
  bucketBaseUrl: string;
  signedUrlExpiry?: number;
}

export async function generateSignedUrl(
  objectPath: string,
  config: SignedUrlConfig
): Promise<string> {
  const { bucketBaseUrl, signedUrlExpiry = 60 } = config;

  const cleanPath = objectPath.replace(/^\//, '');

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

    const { signedUrl } = await response.json() as { signedUrl: string };
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return `${bucketBaseUrl}/${cleanPath}`;
  }
}

export class SecureImageLoader {
  private cache: Map<string, { url: string; expires: number }> = new Map();
  private config: SignedUrlConfig;
  private refreshBuffer: number = 5 * 60 * 1000;

  constructor(config: SignedUrlConfig) {
    this.config = config;
  }

  async getImageUrl(objectPath: string): Promise<string> {
    const now = Date.now();
    const cached = this.cache.get(objectPath);

    if (cached && cached.expires > now + this.refreshBuffer) {
      return cached.url;
    }

    const url = await generateSignedUrl(objectPath, this.config);

    this.cache.set(objectPath, {
      url,
      expires: now + (this.config.signedUrlExpiry || 60) * 60 * 1000 - this.refreshBuffer,
    });

    return url;
  }

  clearCache(): void {
    this.cache.clear();
  }

  preloadImages(objectPaths: string[]): Promise<string[]> {
    return Promise.all(objectPaths.map(path => this.getImageUrl(path)));
  }
}

export function useSecureImage(objectPath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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

export default SecureImageLoader;