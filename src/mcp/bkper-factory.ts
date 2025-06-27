import { Bkper } from 'bkper-js';
import { getOAuthToken } from '../auth/local-auth-service.js';

let configuredBkperInstance: any = null;

/**
 * Get a configured Bkper instance with authentication setup.
 * Uses singleton pattern to avoid repeated configuration.
 * 
 * @returns Configured Bkper instance
 */
export function getBkperInstance(): any {
  // Return mock instance if in test environment
  if (process.env.NODE_ENV === 'test' || (globalThis as any).__mockBkper) {
    return (globalThis as any).__mockBkper || Bkper;
  }

  // Return cached instance if already configured
  if (configuredBkperInstance) {
    return configuredBkperInstance;
  }

  // Configure Bkper with authentication
  Bkper.setConfig({
    apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
    oauthTokenProvider: () => getOAuthToken()
  });

  // Cache the configured instance
  configuredBkperInstance = Bkper;
  
  return configuredBkperInstance;
}

/**
 * Reset the cached instance (useful for testing)
 */
export function resetBkperInstance(): void {
  configuredBkperInstance = null;
}