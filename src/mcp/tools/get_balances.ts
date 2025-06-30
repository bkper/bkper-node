import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';

// Simplified interfaces without pagination
interface GetBalancesParams {
  bookId: string;
  query?: string;
}

interface BalancesResponse {
  total: number;
  balances: Array<any>;
  query?: string;
}

interface BalancesCacheEntry {
  balances: Array<any>;
  timestamp: number;
  total: number;
  query?: string;
}

class BalancesCache {
  private cache: Map<string, BalancesCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(bookId: string, query?: string): string {
    return `balances_${bookId}_${query || 'all'}`;
  }

  getCachedBalances(bookId: string, query?: string): BalancesCacheEntry | null {
    // Disable caching in test environment to avoid conflicts
    if (process.env.NODE_ENV === 'test' || (globalThis as any).__mockBkper) {
      return null;
    }
    
    const cacheKey = this.getCacheKey(bookId, query);
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

  setCachedBalances(bookId: string, balances: Array<any>, total: number, query?: string): void {
    const cacheKey = this.getCacheKey(bookId, query);
    this.cache.set(cacheKey, {
      balances,
      timestamp: Date.now(),
      total,
      query
    });
  }
}

const balancesCache = new BalancesCache();


async function fetchAndCacheBalances(bookId: string, query?: string): Promise<{ balances: Array<any>; total: number }> {
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

  // Get balances from the book with query (required by bkper-js)
  // Use 'on:$m' as default query to get balances for current month
  const balancesReport = await book.getBalancesReport(query || 'on:$m');
  const bkperBalances = balancesReport.getBalancesContainers();
  
  // Return full balance JSON data
  const balances = bkperBalances.map((balance: any) => balance.json());
  const total = balances.length;
  
  balancesCache.setCachedBalances(bookId, balances, total, query);
  
  return { balances, total };
}

export async function handleGetBalances(params: GetBalancesParams): Promise<CallToolResult> {
  try {
    // Validate required parameters
    if (!params.bookId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: bookId'
      );
    }

    // Get balances from cache or fetch fresh
    let cachedData = balancesCache.getCachedBalances(params.bookId, params.query);
    if (!cachedData) {
      const freshData = await fetchAndCacheBalances(params.bookId, params.query);
      cachedData = {
        balances: freshData.balances,
        total: freshData.total,
        timestamp: Date.now(),
        query: params.query
      };
    }

    const { balances, total } = cachedData;

    // Build simplified response with all balances
    const response: BalancesResponse = {
      total,
      balances
    };

    // Include query in response if provided
    if (params.query) {
      response.query = params.query;
    }

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
      `Failed to get balances: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const getBalancesToolDefinition = {
  name: 'get_balances',
  description: `Get all account balances with optional query filtering.

QUERY SYNTAX:
Balances queries support account, group, and date filtering:

Account Filtering:
- account:'AccountName' - Match specific account balance
- group:'GroupName' - Match balances for accounts in group

Date Filtering:
- on:YYYY-MM-DD - Balances on specific date
- after:YYYY-MM-DD - Balances after date  
- before:YYYY-MM-DD - Balances before date
- Date variables: $d (today), $m (current month), $y (current year)

QUERY EXAMPLES:
- account:'Cash' - Cash account balance
- group:'Current Assets' - All current asset balances
- on:2024-01-31 - All balances as of January 31, 2024
- account:'Cash' on:$m - Cash balance at end of current month
- group:'Revenue' after:2024-01-01 - Revenue balances since start of year

LIMITATIONS:
Balances queries do NOT support amount filtering, text search, or property filtering.
Use list_transactions tool for more advanced filtering.`,
  inputSchema: {
    type: 'object',
    properties: {
      bookId: {
        type: 'string',
        description: 'The unique identifier of the book'
      },
      query: {
        type: 'string',
        description: 'Optional query to filter balances (e.g., "account:\'Cash\'", "group:\'Assets\'", "on:2024-01-31")'
      }
    },
    required: ['bookId']
  }
};