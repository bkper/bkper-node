#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  ListToolsResult,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Bkper } from 'bkper-js';
import { handleGetBook, getBookToolDefinition } from './tools/get_book.js';
import { handleListAccounts, listAccountsToolDefinition } from './tools/list_accounts.js';
import { handleGetBalances, getBalancesToolDefinition } from './tools/get_balances.js';
import { handleListTransactions, listTransactionsToolDefinition } from './tools/list_transactions.js';
import { handleListBooks, listBooksToolDefinition } from './tools/list_books.js';


class BkperMcpServer {
  private server: Server;
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
          listBooksToolDefinition,
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
          return await handleListBooks(request.params.arguments as any, this.bkperInstance);
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