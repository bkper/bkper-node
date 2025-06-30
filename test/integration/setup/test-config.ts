import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Integration test configuration
 */
export interface IntegrationTestConfig {
  // API Configuration
  apiKey: string;
  
  // OAuth Token (if available from environment)
  oauthToken?: string;
  
  // Test-specific configuration
  testBookId?: string;         // Optional specific book ID for testing
  skipCleanup: boolean;         // Whether to skip cleanup after tests
  
  // Timeouts
  defaultTimeout: number;       // Default timeout for async operations
  apiCallTimeout: number;       // Timeout for API calls
  
  // Retry configuration
  maxRetries: number;          // Maximum retries for transient failures
  retryDelay: number;          // Delay between retries in ms
}

/**
 * Validates that required environment variables are set
 */
function validateEnvironment(): void {
  const required = ['BKPER_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for integration tests: ${missing.join(', ')}\n` +
      'Please ensure .env file exists with these variables set.'
    );
  }
}

/**
 * Gets the integration test configuration
 */
export function getTestConfig(): IntegrationTestConfig {
  validateEnvironment();
  
  return {
    // API Configuration
    apiKey: process.env.BKPER_API_KEY!,
    oauthToken: process.env.BKPER_OAUTH_TOKEN,
    
    // Test-specific configuration
    testBookId: process.env.TEST_BOOK_ID,
    skipCleanup: process.env.SKIP_CLEANUP === 'true',
    
    // Timeouts
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10),
    apiCallTimeout: parseInt(process.env.API_CALL_TIMEOUT || '20000', 10),
    
    // Retry configuration
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
  };
}

/**
 * Test mode configuration
 */
export const TestMode = {
  // Whether to run in read-only mode (no data modifications)
  READ_ONLY: true,
  
  // Whether to log API requests/responses for debugging
  DEBUG_API: process.env.DEBUG_API === 'true',
  
  // Whether to skip authentication tests
  SKIP_AUTH_TESTS: process.env.SKIP_AUTH_TESTS === 'true',
} as const;

/**
 * Expected API response structures for validation
 */
export const ExpectedStructures = {
  // Book structure based on bkper-api-types
  book: {
    required: ['id', 'name'] as string[],
    optional: ['ownerName', 'permission', 'collection', 'datePattern', 'decimalSeparator', 
               'timeZone', 'timeZoneOffset', 'lastUpdateMs', 'fractionDigits', 'groups', 
               'properties', 'accounts', 'paymentMethods', 'connections', 'bots', 'apps',
               'lock', 'lockDate', 'visibility'] as string[]
  },
  
  // Account structure
  account: {
    required: ['id', 'name', 'type'] as string[],
    optional: ['normalizedName', 'balance', 'credit', 'groups', 'properties', 
               'archived', 'permanent', 'hasTransactionPosted', 'agentId', 'createdAt'] as string[]
  },
  
  // Transaction structure
  transaction: {
    required: ['id', 'date', 'amount'] as string[],
    optional: ['dateValue', 'description', 'posted', 'checked', 'trashed', 
               'agentId', 'createdAt', 'createdBy', 'creditAccount', 'debitAccount',
               'properties', 'tags', 'urls', 'remoteIds', 'attachments', 'files'] as string[]
  },
  
  // Balance structure
  balance: {
    required: ['account'] as string[],
    optional: ['balance', 'cumulative'] as string[]
  }
};