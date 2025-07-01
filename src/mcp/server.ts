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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { handleGetBook, getBookToolDefinition } from './tools/get_book.js';
import { handleListAccounts, listAccountsToolDefinition } from './tools/list_accounts.js';
import { handleGetBalances, getBalancesToolDefinition } from './tools/get_balances.js';
import { handleListTransactions, listTransactionsToolDefinition } from './tools/list_transactions.js';
import { handleListBooks, listBooksToolDefinition } from './tools/list_books.js';
import { handleListResources, handleReadResource } from './resources/index.js';


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
          resources: {}
        }
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
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
          return await handleListBooks(request.params.arguments as any);
        case 'get_book':
          return await handleGetBook(request.params.arguments as any);
        case 'list_accounts':
          return await handleListAccounts(request.params.arguments as any);
        case 'get_balances':
          return await handleGetBalances(request.params.arguments as any);
        case 'list_transactions':
          return await handleListTransactions(request.params.arguments as any);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return await handleListResources();
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await handleReadResource(request.params.uri);
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

  async testListResources(): Promise<any> {
    // Call the list resources handler directly for testing
    const requestHandlers = (this.server as any)._requestHandlers;
    const handler = requestHandlers.get('resources/list');
    if (!handler) throw new Error('ListResources handler not found');
    
    // Create proper MCP request format
    const request = {
      method: 'resources/list' as const,
      params: {}
    };
    return await handler(request);
  }

  async testReadResource(uri: string): Promise<any> {
    // Call the read resource handler directly for testing
    const requestHandlers = (this.server as any)._requestHandlers;
    const handler = requestHandlers.get('resources/read');
    if (!handler) throw new Error('ReadResource handler not found');
    
    // Create proper MCP request format
    const request = {
      method: 'resources/read' as const,
      params: { uri }
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