import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data - matches bkper.Book interface
interface BookData {
  id?: string;
  name?: string;
  collection?: any;
  agentId?: string;
  autoPost?: boolean;
  closingDate?: string;
  createdAt?: string;
  datePattern?: string;
  decimalSeparator?: "DOT" | "COMMA";
  fractionDigits?: number;
  groups?: any[];
  lastUpdateMs?: string;
  lockDate?: string;
  ownerName?: string;
  pageSize?: number;
  period?: "MONTH" | "QUARTER" | "YEAR";
  periodStartMonth?: any;
  permission?: any;
  properties?: {[name: string]: string};
  timeZone?: string;
  timeZoneOffset?: number;
  totalTransactions?: number;
  totalTransactionsCurrentMonth?: number;
  totalTransactionsCurrentYear?: number;
  visibility?: "PUBLIC" | "PRIVATE";
  accounts?: any[];
}

interface MockBook {
  json(): BookData;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBooks: () => Promise<MockBook[]>;
}

// Mock bkper-js before importing the server
const mockBooks: BookData[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-books.json'), 'utf8'));
const largeMockBooks: BookData[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'large-books-dataset.json'), 'utf8'));

let currentMockBooks: BookData[] = mockBooks;

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBooks: async (): Promise<MockBook[]> => currentMockBooks.map((bookData: BookData) => ({
    json: (): BookData => bookData
  }))
};

// Import the actual MCP server
const { BkperMcpServer } = await import('../src/mcp/server.js');

// Type for the server instance
type BkperMcpServerType = InstanceType<typeof BkperMcpServer>;

describe('MCP Server - Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
    // Reset to small dataset
    currentMockBooks = mockBooks;
    // Create new server instance for each test with mock Bkper
    server = new BkperMcpServer(mockBkperJs);
  });

  it('should register list_books tool in MCP tools list', async function() {
    const response = await server.testListTools();
    
    expect(response).to.have.property('tools');
    expect(response.tools).to.be.an('array');
    
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books');
    expect(listBooksTool).to.exist;
    expect(listBooksTool!.name).to.equal('list_books');
    expect(listBooksTool!.description).to.include('fixed 50-item pagination');
    expect(listBooksTool!.inputSchema).to.have.property('properties');
    expect(listBooksTool!.inputSchema.properties).to.have.property('cursor');
    expect(listBooksTool!.inputSchema.properties).to.not.have.property('limit');
  });

  it('should have proper MCP tool schema for list_books', async function() {
    const response = await server.testListTools();
    const listBooksTool = response.tools.find((tool: any) => tool.name === 'list_books');
    
    expect(listBooksTool!.inputSchema).to.deep.equal({
      type: 'object',
      properties: {
        cursor: {
          type: 'string',
          description: 'Pagination cursor for next page'
        }
      },
      required: []
    });
  });
});

describe('MCP Server - list_books Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockBooks = mockBooks;
    server = new BkperMcpServer(mockBkperJs);
  });

  it('should handle MCP list_books tool call without cursor', async function() {
    const response = await server.testCallTool('list_books');
    
    // Verify MCP response structure
    expect(response).to.have.property('content');
    expect(response.content).to.be.an('array');
    expect(response.content).to.have.length(1);
    expect(response.content[0]).to.have.property('type', 'text');
    expect(response.content[0]).to.have.property('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse).to.have.property('total');
    expect(jsonResponse).to.have.property('books');
    expect(jsonResponse).to.have.property('pagination');
    
    expect(jsonResponse.total).to.equal(2);
    expect(jsonResponse.books).to.have.length(2);
    expect(jsonResponse.pagination.limit).to.equal(50);
    expect(jsonResponse.pagination.offset).to.equal(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
  });

  it('should handle MCP list_books tool call with cursor', async function() {
    // Switch to large dataset
    currentMockBooks = largeMockBooks;
    server = new BkperMcpServer(mockBkperJs);
    
    // First call to get cursor
    const firstResponse = await server.testCallTool('list_books');
    const firstData = JSON.parse(firstResponse.content[0].text as string);
    
    expect(firstData.pagination.hasMore).to.be.true;
    expect(firstData.pagination.nextCursor).to.be.a('string');
    
    // Second call with cursor
    const response = await server.testCallTool('list_books', { 
      cursor: firstData.pagination.nextCursor 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    expect(jsonResponse.pagination.offset).to.equal(50);
    expect(jsonResponse.books).to.have.length(50);
  });

  it('should return proper MCP error for unknown tool', async function() {
    try {
      await server.testCallTool('unknown_tool');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.include('Unknown tool');
    }
  });

  it('should handle invalid cursor gracefully', async function() {
    const response = await server.testCallTool('list_books', { 
      cursor: 'invalid-cursor' 
    });
    
    const jsonResponse = JSON.parse(response.content[0].text as string);
    // Should fall back to first page
    expect(jsonResponse.pagination.offset).to.equal(0);
  });
});

describe('MCP Server - Pagination Edge Cases', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockBooks = largeMockBooks;
    server = new BkperMcpServer(mockBkperJs);
  });

  afterEach(function() {
    currentMockBooks = mockBooks;
  });

  it('should handle cursor pointing beyond data via MCP', async function() {
    // Create cursor that points beyond available data
    const beyondDataCursor = Buffer.from(JSON.stringify({
      offset: 1000, // Beyond our 500 books
      timestamp: Date.now()
    })).toString('base64');

    const response = await server.testCallTool('list_books', { cursor: beyondDataCursor });
    const jsonResponse = JSON.parse(response.content[0].text as string);

    expect(jsonResponse.books).to.have.length(0);
    expect(jsonResponse.pagination.hasMore).to.be.false;
    expect(jsonResponse.pagination.nextCursor).to.be.null;
    expect(jsonResponse.pagination.offset).to.equal(1000);
  });

  it('should handle expired cursor via MCP', async function() {
    // Create cursor with old timestamp (6+ minutes ago)
    const expiredCursor = Buffer.from(JSON.stringify({
      offset: 50,
      timestamp: Date.now() - (6 * 60 * 1000)
    })).toString('base64');

    const response = await server.testCallTool('list_books', { cursor: expiredCursor });
    const jsonResponse = JSON.parse(response.content[0].text as string);

    // Should fall back to first page
    expect(jsonResponse.pagination.offset).to.equal(0);
    expect(jsonResponse.books).to.have.length(50);
  });
});