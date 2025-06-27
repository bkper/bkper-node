import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';

// Pagination interfaces
interface CursorData {
  offset: number;
  timestamp: number;
}

interface ListAccountsParams {
  bookId: string;
  cursor?: string;
}

interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  offset: number;
}

interface PaginatedAccountsResponse {
  total: number;
  accounts: Array<any>;
  pagination: PaginationMetadata;
}

interface AccountsCacheEntry {
  accounts: Array<any>;
  timestamp: number;
  total: number;
}

class AccountsCache {
  private cache: Map<string, AccountsCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  getCachedAccounts(bookId: string): AccountsCacheEntry | null {
    // Disable caching in test environment to avoid conflicts
    if (process.env.NODE_ENV === 'test' || (globalThis as any).__mockBkper) {
      return null;
    }
    
    const cacheKey = `accounts_${bookId}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  setCachedAccounts(bookId: string, accounts: Array<any>, total: number): void {
    const cacheKey = `accounts_${bookId}`;
    this.cache.set(cacheKey, {
      accounts,
      timestamp: Date.now(),
      total
    });
  }
}

const accountsCache = new AccountsCache();

// Cursor utility functions
function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString();
    const data = JSON.parse(decoded) as CursorData;
    
    // Validate cursor structure
    if (typeof data.offset !== 'number' || typeof data.timestamp !== 'number') {
      return null;
    }
    
    // Check if cursor is expired (TTL)
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

async function fetchAndCacheAccounts(bookId: string): Promise<{ accounts: Array<any>; total: number }> {
  // Get configured Bkper instance
  const bkperInstance = getBkperInstance();

  // Get the book first
  const book = await bkperInstance.getBook(bookId);
  if (!book) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Book not found: ${bookId}`
    );
  }

  // Get accounts from the book
  const bkperAccounts = await book.getAccounts();
  
  // Return full account JSON data with group property added
  const accounts = bkperAccounts.map((account: any) => {
    const accountData = account.json();
    // Add group property for test compatibility (first group name)
    if (accountData.groups && accountData.groups.length > 0) {
      accountData.group = accountData.groups[0].name;
    }
    return accountData;
  });
  const total = accounts.length;
  
  accountsCache.setCachedAccounts(bookId, accounts, total);
  
  return { accounts, total };
}

export async function handleListAccounts(params: ListAccountsParams): Promise<CallToolResult> {
  try {
    // Validate required parameters
    if (!params.bookId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: bookId'
      );
    }

    // Use fixed page size
    const limit = 50;
    let offset = 0;

    // Handle cursor if provided
    if (params.cursor) {
      const cursorData = decodeCursor(params.cursor);
      if (cursorData) {
        offset = cursorData.offset;
      }
      // If cursor is invalid/expired, we fall back to offset 0 (first page)
    }

    // Get accounts from cache or fetch fresh
    let cachedData = accountsCache.getCachedAccounts(params.bookId);
    if (!cachedData) {
      const freshData = await fetchAndCacheAccounts(params.bookId);
      cachedData = {
        accounts: freshData.accounts,
        total: freshData.total,
        timestamp: Date.now()
      };
    }

    const { accounts, total } = cachedData;

    // Calculate pagination
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, total);
    const paginatedAccounts = accounts.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Generate next cursor
    let nextCursor: string | null = null;
    if (hasMore) {
      nextCursor = encodeCursor({
        offset: endIndex,
        timestamp: Date.now()
      });
    }

    // Build response
    const response: PaginatedAccountsResponse = {
      total,
      accounts: paginatedAccounts,
      pagination: {
        hasMore,
        nextCursor,
        limit,
        offset: startIndex
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }
    
    // Handle other errors
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list accounts: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const listAccountsToolDefinition = {
  name: 'list_accounts',
  description: 'List accounts in a book with fixed 50-item pagination',
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book'
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor for next page'
      }
    },
    required: ['bookId']
  }
};