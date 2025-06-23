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

class BkperMcpServer {
  private server: Server;

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
            description: 'List all books in the authenticated user\'s Bkper account',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_books':
          return await this.handleListBooks();
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleListBooks() {
    try {
      // Configure Bkper with authentication
      Bkper.setConfig({
        apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
        oauthTokenProvider: () => getOAuthToken()
      });

      // Get books using high-level wrapper
      const books = await Bkper.getBooks();
      
      // Calculate optimal limit: 10 books = ~1000 bytes, target ~50KB max response
      // Each book entry averages ~100 bytes, so ~200 books should fit comfortably
      const OPTIMAL_BOOK_LIMIT = 200;
      const bookCount = books.length;
      const limitedBooks = Math.min(OPTIMAL_BOOK_LIMIT, bookCount);
      
      const essentialBooksData = books.slice(0, limitedBooks).map(book => {
        const fullData = book.json();
        return {
          id: fullData.id,
          name: fullData.name
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: bookCount,
              showing: `First ${limitedBooks} of ${bookCount} books`,
              books: essentialBooksData
            }, null, 2),
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