#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  ListToolsResult,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Bkper } from 'bkper-js';
import { getOAuthToken } from '../auth/local-auth-service.js';
import { handleGetBook, getBookToolDefinition } from './tools/get_book.js';
import { handleListAccounts, listAccountsToolDefinition } from './tools/list_accounts.js';
import { handleGetBalances, getBalancesToolDefinition } from './tools/get_balances.js';
import { handleListTransactions, listTransactionsToolDefinition } from './tools/list_transactions.js';

// Pagination interfaces
interface CursorData {
  offset: number;
  timestamp: number;
}

interface PaginationParams {
  cursor?: string;
}

interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  offset: number;
}

interface PaginatedResponse {
  total: number;
  books: Array<any>; // Full bkper.Book JSON objects
  pagination: PaginationMetadata;
}

interface CacheEntry {
  books: Array<any>; // Full bkper.Book JSON objects
  timestamp: number;
  total: number;
}

class BkperMcpServer {
  private server: Server;
  private booksCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly FIXED_PAGE_SIZE = 50;
  private bkperInstance: any;

  constructor(bkperInstance?: any) {
    this.bkperInstance = bkperInstance || Bkper;
    this.server = new Server(
      {
        name: 'bkper-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_books',
            description: 'List books with fixed 50-item pagination',
            inputSchema: {
              type: 'object',
              properties: {
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor for next page'
                }
              },
              required: [],
            },
          },
          getBookToolDefinition,
          listAccountsToolDefinition,
          getBalancesToolDefinition,
          listTransactionsToolDefinition,
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_books':
          const params = request.params.arguments as PaginationParams;
          return await this.handleListBooks(params);
        case 'get_book':
          return await handleGetBook(request.params.arguments as any, this.bkperInstance);
        case 'list_accounts':
          return await handleListAccounts(request.params.arguments as any, this.bkperInstance);
        case 'get_balances':
          return await handleGetBalances(request.params.arguments as any, this.bkperInstance);
        case 'list_transactions':
          return await handleListTransactions(request.params.arguments as any, this.bkperInstance);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  // Cursor utility methods
  private encodeCursor(data: CursorData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeCursor(cursor: string): CursorData | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString();
      const data = JSON.parse(decoded) as CursorData;
      
      // Validate cursor structure
      if (typeof data.offset !== 'number' || typeof data.timestamp !== 'number') {
        return null;
      }
      
      // Check if cursor is expired (TTL)
      if (Date.now() - data.timestamp > this.CACHE_TTL) {
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  // Cache management methods
  private getCachedBooks(): CacheEntry | null {
    const cacheKey = 'books_cache';
    const cached = this.booksCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.booksCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  private setCachedBooks(books: Array<any>, total: number): void {
    const cacheKey = 'books_cache';
    this.booksCache.set(cacheKey, {
      books,
      timestamp: Date.now(),
      total
    });
  }

  private async fetchAndCacheBooks(): Promise<{ books: Array<any>; total: number }> {
    // Configure Bkper with authentication
    this.bkperInstance.setConfig({
      apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
      oauthTokenProvider: () => getOAuthToken()
    });

    // Get books using high-level wrapper
    const bkperBooks = await this.bkperInstance.getBooks();
    
    // Return full book JSON data - no filtering, no transforming
    const books = bkperBooks.map((book: any) => book.json());

    const total = books.length;
    this.setCachedBooks(books, total);
    
    return { books, total };
  }

  private async handleListBooks(params: PaginationParams = {}): Promise<any> {
    try {
      // Use fixed page size
      const limit = this.FIXED_PAGE_SIZE;
      let offset = 0;

      // Handle cursor if provided
      if (params.cursor) {
        const cursorData = this.decodeCursor(params.cursor);
        if (cursorData) {
          offset = cursorData.offset;
        }
        // If cursor is invalid/expired, we fall back to offset 0 (first page)
      }

      // Get books from cache or fetch fresh
      let cachedData = this.getCachedBooks();
      if (!cachedData) {
        const freshData = await this.fetchAndCacheBooks();
        cachedData = {
          books: freshData.books,
          total: freshData.total,
          timestamp: Date.now()
        };
      }

      const { books, total } = cachedData;

      // Calculate pagination
      const startIndex = offset;
      const endIndex = Math.min(startIndex + limit, total);
      const paginatedBooks = books.slice(startIndex, endIndex);
      const hasMore = endIndex < total;

      // Generate next cursor
      let nextCursor: string | null = null;
      if (hasMore) {
        nextCursor = this.encodeCursor({
          offset: endIndex,
          timestamp: Date.now()
        });
      }

      // Build response
      const response: PaginatedResponse = {
        total,
        books: paginatedBooks,
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
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list books: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bkper MCP server running on stdio');
  }

  // Test helper methods for accessing MCP handlers directly
  async testListTools(): Promise<ListToolsResult> {
    // Call the list tools handler directly for testing
    const requestHandlers = (this.server as any)._requestHandlers;
    const handler = requestHandlers.get('tools/list');
    if (!handler) throw new Error('ListTools handler not found');
    
    // Create proper MCP request format
    const request = {
      method: 'tools/list' as const,
      params: {}
    };
    return await handler(request);
  }

  async testCallTool(name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
    // Call the call tool handler directly for testing  
    const requestHandlers = (this.server as any)._requestHandlers;
    const handler = requestHandlers.get('tools/call');
    if (!handler) throw new Error('CallTool handler not found');
    
    // Create proper MCP request format
    const request = {
      method: 'tools/call' as const,
      params: { name, arguments: args }
    };
    return await handler(request);
  }
}

// Export the class for testing
export { BkperMcpServer };

// Only run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new BkperMcpServer();
  server.run().catch(console.error);
}