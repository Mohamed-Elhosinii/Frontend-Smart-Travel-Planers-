import { environment } from '../../../environments/environment';

/**
 * Third-party (non-backend) service configuration. Keeps external hosts, keys
 * and fallback assets out of feature code.
 */
export const UNSPLASH_CONFIG = {
  accessKey: environment.unsplashAccessKey,
  searchUrl: 'https://api.unsplash.com/search/photos',
  fallbackImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
} as const;
