import { environment } from '../../../environments/environment';

/**
 * The single source of truth for the API base URL.
 *
 * Relative in development (proxied to the backend) and absolute in production —
 * both resolved from the environment so no host/port is hardcoded in services.
 */
export const API_BASE_URL = environment.apiUrl;
