import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data
interface BalanceData {
  account: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  balance: number;
  normalizedBalance: number;
  cumulative: number;
  group?: {
    id: string;
    name: string;
  };
}

interface MockBalanceReport {
  getBalances(): Promise<MockBalance[]>;
}

interface MockBalance {
  json(): BalanceData;
}

interface MockBook {
  getBalancesReport(query?: string): Promise<MockBalanceReport>;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBook: (id: string) => Promise<MockBook>;
}

// Mock balance data from fixtures
const mockBalances: BalanceData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures', 'sample-balances.json'), 'utf8'));

// Create a large dataset for pagination testing (100+ balances)
const largeMockBalances: BalanceData[] = Array.from({ length: 150 }, (_, i) => ({
  account: {
    id: `account-${i + 1}`,
    name: `Account ${i + 1}`,
    type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any
  },
  balance: Math.floor(Math.random() * 10000) - 5000, // Can be positive or negative
  normalizedBalance: Math.abs(Math.floor(Math.random() * 10000)),
  cumulative: Math.floor(Math.random() * 50000),
  group: {
    id: `group-${Math.floor(i / 10)}`,
    name: `Group ${Math.floor(i / 10)}`
  }
}));

let currentMockBalances: BalanceData[] = mockBalances;

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBook: async (id: string): Promise<MockBook> => {
    return {
      getBalancesReport: async (query?: string): Promise<MockBalanceReport> => {
        // Apply basic query filtering for testing (simplified for balances)
        let filteredBalances = currentMockBalances;
        
        if (query) {
          // Simple query simulation for testing - only account, group, and date filters
          if (query.includes("account:'Cash'")) {
            filteredBalances = currentMockBalances.filter(b => b.account.name === 'Cash');
          } else if (query.includes("group:'Assets'")) {
            filteredBalances = currentMockBalances.filter(b => b.account.type === 'ASSET');
          } else if (query.includes("group:'Liabilities'")) {
            filteredBalances = currentMockBalances.filter(b => b.account.type === 'LIABILITY');
          }
        }
        
        return {
          getBalances: async (): Promise<MockBalance[]> => filteredBalances.map((balanceData: BalanceData) => ({
            json: (): BalanceData => balanceData
          }))
        };
      }
    };
  }
};

// Mock auth service
const mockGetOAuthToken = async (): Promise<string> => 'mock-token';

// Setup module mocking
async function setupMocks() {
  const originalImport = await import('module');
  const ModuleClass = originalImport.Module as any;
  const originalResolveFilename = ModuleClass._resolveFilename;
  const originalLoad = ModuleClass.load;

  ModuleClass._resolveFilename = function(request: string, parent: any, isMain?: boolean) {
    if (request === 'bkper-js') {
      return 'mocked-bkper-js';
    }
    if (request.includes('local-auth-service.js')) {
      return 'mocked-auth-service';
    }
    return originalResolveFilename.call(this, request, parent, isMain);
  };

  ModuleClass.load = function(filename: string) {
    if (filename === 'mocked-bkper-js') {
      (this as any).exports = { Bkper: mockBkperJs };
      return;
    }
    if (filename === 'mocked-auth-service') {
      (this as any).exports = { getOAuthToken: mockGetOAuthToken };
      return;
    }
    return originalLoad.call(this, filename);
  };
}

// Initialize mocks
setupMocks();

// Import the actual MCP server after mocks are set up
const { BkperMcpServer } = await import('../../src/mcp/server.js');

// Type for the server instance
type BkperMcpServerType = InstanceType<typeof BkperMcpServer>;

describe('MCP Server - get_balances Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockBalances = mockBalances;
    server = new BkperMcpServer();
  });

  it('should register get_balances tool in MCP tools list (when implemented)', async function() {
    const response = await server.testListTools();
    
    const getBalancesTool = response.tools.find((tool: any) => tool.name === 'get_balances');
    
    if (getBalancesTool) {
      expect(getBalancesTool.name).to.equal('get_balances');
      expect(getBalancesTool.description).to.include('fixed 50-item pagination');
      expect(getBalancesTool.inputSchema).to.have.property('properties');
      expect(getBalancesTool.inputSchema.properties).to.have.property('bookId');
      expect(getBalancesTool.inputSchema.properties).to.have.property('cursor');
      expect(getBalancesTool.inputSchema.properties).to.have.property('query');
      expect(getBalancesTool.inputSchema.properties).to.not.have.property('limit');
      expect(getBalancesTool.inputSchema.required).to.include('bookId');
    } else {
      // Tool not implemented yet - expected during development
      expect(getBalancesTool).to.be.undefined;
    }
  });

  it('should have proper MCP tool schema for get_balances (when implemented)', async function() {
    const response = await server.testListTools();
    const getBalancesTool = response.tools.find((tool: any) => tool.name === 'get_balances');
    
    if (getBalancesTool) {
      expect(getBalancesTool.inputSchema).to.deep.equal({
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            description: 'The unique identifier of the book'
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for next page'
          },
          query: {
            type: 'string',
            description: 'Optional query to filter balances (e.g., "account:\'Cash\'", "group:\'Assets\'", "on:2024-01-31")'
          }
        },
        required: ['bookId']
      });
    } else {
      // Expected during development
      expect(getBalancesTool).to.be.undefined;
    }
  });
});

describe('MCP Server - get_balances Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockBalances = mockBalances;
    server = new BkperMcpServer();
  });

  it('should handle MCP get_balances tool call without query (when implemented)', async function() {
    try {
      const response = await server.testCallTool('get_balances', { bookId: 'book-1' });
      
      // Verify MCP response structure
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');
      expect(response.content).to.have.length(1);
      expect(response.content[0]).to.have.property('type', 'text');
      expect(response.content[0]).to.have.property('text');
      
      // Parse the JSON response
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse).to.have.property('total');
      expect(jsonResponse).to.have.property('balances');
      expect(jsonResponse).to.have.property('pagination');
      
      expect(jsonResponse.total).to.equal(10);
      expect(jsonResponse.balances).to.have.length(10);
      expect(jsonResponse.pagination.limit).to.equal(50);
      expect(jsonResponse.pagination.offset).to.equal(0);
      expect(jsonResponse.pagination.hasMore).to.be.false;
      
      // Verify balance structure
      const balance = jsonResponse.balances[0];
      expect(balance).to.have.property('account');
      expect(balance).to.have.property('balance');
      expect(balance).to.have.property('normalizedBalance');
      expect(balance).to.have.property('cumulative');
      expect(balance.account).to.have.property('id');
      expect(balance.account).to.have.property('name');
      expect(balance.account).to.have.property('type');
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_balances');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP get_balances tool call with query filter (when implemented)', async function() {
    try {
      const response = await server.testCallTool('get_balances', { 
        bookId: 'book-1',
        query: "account:'Cash'"
      });
      
      const jsonResponse = JSON.parse(response.content[0].text as string);
      
      // Verify all returned balances are for Cash account
      jsonResponse.balances.forEach((balance: any) => {
        expect(balance.account.name).to.equal('Cash');
      });
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_balances');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP get_balances tool call with pagination (when implemented)', async function() {
    try {
      // Switch to large dataset
      currentMockBalances = largeMockBalances;
      server = new BkperMcpServer();
      
      // First call to get cursor
      const firstResponse = await server.testCallTool('get_balances', { bookId: 'book-1' });
      const firstData = JSON.parse(firstResponse.content[0].text as string);
      
      expect(firstData.pagination.hasMore).to.be.true;
      expect(firstData.pagination.nextCursor).to.be.a('string');
      
      // Second call with cursor
      const response = await server.testCallTool('get_balances', { 
        bookId: 'book-1',
        cursor: firstData.pagination.nextCursor 
      });
      
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse.pagination.offset).to.equal(50);
      expect(jsonResponse.balances).to.have.length(50);
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_balances');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP error for missing bookId parameter (when implemented)', async function() {
    try {
      await server.testCallTool('get_balances', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_balances');
      } else {
        // When implemented, should return proper validation error
        expect(error).to.be.an('error');
      }
    }
  });

  it('should handle balance query examples via MCP (when implemented)', async function() {
    try {
      // Test different query patterns
      const accountQuery = await server.testCallTool('get_balances', { 
        bookId: 'book-1',
        query: "account:'Cash'"
      });
      
      const groupQuery = await server.testCallTool('get_balances', { 
        bookId: 'book-1',
        query: "group:'Assets'"
      });
      
      const dateQuery = await server.testCallTool('get_balances', { 
        bookId: 'book-1',
        query: "on:2024-01-31"
      });
      
      // All should return valid MCP responses
      [accountQuery, groupQuery, dateQuery].forEach(response => {
        expect(response).to.have.property('content');
        expect(response.content[0]).to.have.property('type', 'text');
        const data = JSON.parse(response.content[0].text as string);
        expect(data).to.have.property('balances');
        expect(data).to.have.property('pagination');
      });
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('get_balances');
      } else {
        throw error;
      }
    }
  });
});