#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Bkper } from 'bkper-js';
import { getOAuthToken } from '../auth/local-auth-service.js';

// Pagination interfaces
interface CursorData {
  offset: number;
  timestamp: number;
}

interface PaginationParams {
  cursor?: string;
  limit?: number;
}

interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  offset: number;
}

interface PaginatedResponse {
  total: number;
  books: Array<{ id: string; name: string }>;
  pagination: PaginationMetadata;
}

interface CacheEntry {
  books: Array<{ id: string; name: string }>;
  timestamp: number;
  total: number;
}

class BkperMcpServer {
  private server: Server;
  private booksCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 200;
  private readonly MIN_LIMIT = 1;

  constructor() {
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
            description: 'List books with pagination support',
            inputSchema: {
              type: 'object',
              properties: {
                cursor: {
                  type: 'string',
                  description: 'Pagination cursor for next page'
                },
                limit: {
                  type: 'number',
                  description: 'Number of books per page (1-200, default 50)',
                  minimum: 1,
                  maximum: 200,
                  default: 50
                }
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_books':
          const params = request.params.arguments as PaginationParams;
          return await this.handleListBooks(params);
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

  private setCachedBooks(books: Array<{ id: string; name: string }>, total: number): void {
    const cacheKey = 'books_cache';
    this.booksCache.set(cacheKey, {
      books,
      timestamp: Date.now(),
      total
    });
  }

  private async fetchAndCacheBooks(): Promise<{ books: Array<{ id: string; name: string }>; total: number }> {
    // Configure Bkper with authentication
    Bkper.setConfig({
      apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
      oauthTokenProvider: () => getOAuthToken()
    });

    // Get books using high-level wrapper
    const bkperBooks = await Bkper.getBooks();
    
    const books = bkperBooks.map(book => {
      const fullData = book.json();
      return {
        id: fullData.id || '',
        name: fullData.name || ''
      };
    }).filter(book => book.id && book.name); // Filter out books with missing data

    const total = books.length;
    this.setCachedBooks(books, total);
    
    return { books, total };
  }

  private async handleListBooks(params: PaginationParams = {}): Promise<any> {
    try {
      // Parse pagination parameters
      const limit = Math.max(this.MIN_LIMIT, Math.min(this.MAX_LIMIT, params.limit || this.DEFAULT_LIMIT));
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
}

const server = new BkperMcpServer();
server.run().catch(console.error);