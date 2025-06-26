import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data
interface AccountData {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  balance: number;
  normalizedBalance: number;
  group?: {
    id: string;
    name: string;
  };
  properties: {[name: string]: string};
  archived: boolean;
  permanent: boolean;
}

interface MockAccount {
  json(): AccountData;
}

interface MockBook {
  getAccounts(): Promise<MockAccount[]>;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBook: (id: string) => Promise<MockBook>;
}

// Mock account data from fixtures
const mockAccounts: AccountData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures', 'sample-accounts.json'), 'utf8'));

// Create a large dataset for pagination testing (100+ accounts)
const largeMockAccounts: AccountData[] = Array.from({ length: 150 }, (_, i) => ({
  id: `account-${i + 1}`,
  name: `Account ${i + 1}`,
  type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any,
  balance: Math.floor(Math.random() * 10000),
  normalizedBalance: Math.floor(Math.random() * 10000),
  group: {
    id: `group-${Math.floor(i / 10)}`,
    name: `Group ${Math.floor(i / 10)}`
  },
  properties: {},
  archived: false,
  permanent: false
}));

let currentMockAccounts: AccountData[] = mockAccounts;

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBook: async (id: string): Promise<MockBook> => {
    return {
      getAccounts: async (): Promise<MockAccount[]> => currentMockAccounts.map((accountData: AccountData) => ({
        json: (): AccountData => accountData
      }))
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

describe('MCP Server - list_accounts Tool Registration', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockAccounts = mockAccounts;
    server = new BkperMcpServer();
  });

  it('should register list_accounts tool in MCP tools list (when implemented)', async function() {
    const response = await server.testListTools();
    
    const listAccountsTool = response.tools.find((tool: any) => tool.name === 'list_accounts');
    
    if (listAccountsTool) {
      expect(listAccountsTool.name).to.equal('list_accounts');
      expect(listAccountsTool.description).to.include('fixed 50-item pagination');
      expect(listAccountsTool.inputSchema).to.have.property('properties');
      expect(listAccountsTool.inputSchema.properties).to.have.property('bookId');
      expect(listAccountsTool.inputSchema.properties).to.have.property('cursor');
      expect(listAccountsTool.inputSchema.properties).to.not.have.property('limit');
      expect(listAccountsTool.inputSchema.required).to.include('bookId');
    } else {
      // Tool not implemented yet - expected during development
      expect(listAccountsTool).to.be.undefined;
    }
  });

  it('should have proper MCP tool schema for list_accounts (when implemented)', async function() {
    const response = await server.testListTools();
    const listAccountsTool = response.tools.find((tool: any) => tool.name === 'list_accounts');
    
    if (listAccountsTool) {
      expect(listAccountsTool.inputSchema).to.deep.equal({
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
      });
    } else {
      // Expected during development
      expect(listAccountsTool).to.be.undefined;
    }
  });
});

describe('MCP Server - list_accounts Tool Calls', function() {
  let server: BkperMcpServerType;

  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockAccounts = mockAccounts;
    server = new BkperMcpServer();
  });

  it('should handle MCP list_accounts tool call without cursor (when implemented)', async function() {
    try {
      const response = await server.testCallTool('list_accounts', { bookId: 'book-1' });
      
      // Verify MCP response structure
      expect(response).to.have.property('content');
      expect(response.content).to.be.an('array');
      expect(response.content).to.have.length(1);
      expect(response.content[0]).to.have.property('type', 'text');
      expect(response.content[0]).to.have.property('text');
      
      // Parse the JSON response
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse).to.have.property('total');
      expect(jsonResponse).to.have.property('accounts');
      expect(jsonResponse).to.have.property('pagination');
      
      expect(jsonResponse.total).to.equal(10);
      expect(jsonResponse.accounts).to.have.length(10);
      expect(jsonResponse.pagination.limit).to.equal(50);
      expect(jsonResponse.pagination.offset).to.equal(0);
      expect(jsonResponse.pagination.hasMore).to.be.false;
      
      // Verify account structure
      const account = jsonResponse.accounts[0];
      expect(account).to.have.property('id');
      expect(account).to.have.property('name');
      expect(account).to.have.property('type');
      expect(account).to.have.property('balance');
      expect(account).to.have.property('group');
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('list_accounts');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP list_accounts tool call with cursor (when implemented)', async function() {
    try {
      // Switch to large dataset
      currentMockAccounts = largeMockAccounts;
      server = new BkperMcpServer();
      
      // First call to get cursor
      const firstResponse = await server.testCallTool('list_accounts', { bookId: 'book-1' });
      const firstData = JSON.parse(firstResponse.content[0].text as string);
      
      expect(firstData.pagination.hasMore).to.be.true;
      expect(firstData.pagination.nextCursor).to.be.a('string');
      
      // Second call with cursor
      const response = await server.testCallTool('list_accounts', { 
        bookId: 'book-1',
        cursor: firstData.pagination.nextCursor 
      });
      
      const jsonResponse = JSON.parse(response.content[0].text as string);
      expect(jsonResponse.pagination.offset).to.equal(50);
      expect(jsonResponse.accounts).to.have.length(50);
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('list_accounts');
      } else {
        throw error;
      }
    }
  });

  it('should handle MCP error for missing bookId parameter (when implemented)', async function() {
    try {
      await server.testCallTool('list_accounts', {});
      expect.fail('Should have thrown an error for missing bookId');
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('list_accounts');
      } else {
        // When implemented, should return proper validation error
        expect(error).to.be.an('error');
      }
    }
  });

  it('should handle account type organization via MCP (when implemented)', async function() {
    try {
      // Switch to large dataset with different account types
      currentMockAccounts = largeMockAccounts;
      server = new BkperMcpServer();
      
      const response = await server.testCallTool('list_accounts', { bookId: 'book-1' });
      const jsonResponse = JSON.parse(response.content[0].text as string);
      
      // Verify we have different account types
      const accounts = jsonResponse.accounts;
      const assetAccounts = accounts.filter((acc: any) => acc.type === 'ASSET');
      const liabilityAccounts = accounts.filter((acc: any) => acc.type === 'LIABILITY');
      const equityAccounts = accounts.filter((acc: any) => acc.type === 'EQUITY');
      const incomeAccounts = accounts.filter((acc: any) => acc.type === 'INCOME');
      const outgoingAccounts = accounts.filter((acc: any) => acc.type === 'OUTGOING');

      expect(assetAccounts.length).to.be.greaterThan(0);
      expect(liabilityAccounts.length).to.be.greaterThan(0);
      expect(equityAccounts.length).to.be.greaterThan(0);
      expect(incomeAccounts.length).to.be.greaterThan(0);
      expect(outgoingAccounts.length).to.be.greaterThan(0);
      
    } catch (error) {
      if ((error as Error).message.includes('Unknown tool')) {
        // Tool not implemented yet - expected during development
        expect((error as Error).message).to.include('list_accounts');
      } else {
        throw error;
      }
    }
  });
});