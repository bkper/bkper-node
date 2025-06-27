import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getBkperInstance } from '../bkper-factory.js';

// Pagination interfaces
interface CursorData {
  offset: number;
  timestamp: number;
}

interface ListBooksParams {
  cursor?: string;
}

interface PaginationMetadata {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
  offset: number;
}

interface PaginatedBooksResponse {
  total: number;
  books: Array<any>; // Full bkper.Book JSON objects
  pagination: PaginationMetadata;
}

interface BooksCacheEntry {
  books: Array<any>; // Full bkper.Book JSON objects
  timestamp: number;
  total: number;
}

class BooksCache {
  private cache: Map<string, BooksCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  getCachedBooks(): BooksCacheEntry | null {
    // Disable caching in test environment to avoid conflicts
    if (process.env.NODE_ENV === 'test' || (globalThis as any).__mockBkper) {
      return null;
    }
    
    const cacheKey = 'books_cache';
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

  setCachedBooks(books: Array<any>, total: number): void {
    const cacheKey = 'books_cache';
    this.cache.set(cacheKey, {
      books,
      timestamp: Date.now(),
      total
    });
  }
}

const booksCache = new BooksCache();

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

async function fetchAndCacheBooks(): Promise<{ books: Array<any>; total: number }> {
  // Get configured Bkper instance
  const bkperInstance = getBkperInstance();

  // Get books using high-level wrapper
  const bkperBooks = await bkperInstance.getBooks();
  
  // Return full book JSON data - no filtering, no transforming
  const books = bkperBooks.map((book: any) => book.json());

  const total = books.length;
  booksCache.setCachedBooks(books, total);
  
  return { books, total };
}

export async function handleListBooks(params: ListBooksParams): Promise<CallToolResult> {
  try {
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

    // Get books from cache or fetch fresh
    let cachedData = booksCache.getCachedBooks();
    if (!cachedData) {
      const freshData = await fetchAndCacheBooks();
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
      nextCursor = encodeCursor({
        offset: endIndex,
        timestamp: Date.now()
      });
    }

    // Build response
    const response: PaginatedBooksResponse = {
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
    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }
    
    // Handle other errors
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list books: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const listBooksToolDefinition = {
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
    required: []
  }
};