/**
 * Development environment.
 *
 * `apiUrl` is relative so requests flow through the Angular dev-server proxy
 * (`proxy.conf.json` → the .NET backend). Keep the shape identical to
 * `environment.prod.ts`.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  websiteUrl: 'http://localhost:4200',
  unsplashAccessKey: 'Bzkr7dhaRA_5FehtPNuhT0cvORCxQObkqC_Krhg30k8',
};
