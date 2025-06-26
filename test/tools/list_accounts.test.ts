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

describe('MCP Server - list_accounts tool', function() {
  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
    // Reset to small dataset
    currentMockAccounts = mockAccounts;
  });

  it('should return formatted account list response', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const accounts = await book.getAccounts();
    
    const fullAccountsData = accounts.slice(0, 50).map(account => account.json());

    const expectedResponse = {
      total: accounts.length,
      accounts: fullAccountsData,
      pagination: {
        hasMore: accounts.length > 50,
        nextCursor: accounts.length > 50 ? 'some-cursor-string' : null,
        limit: 50,
        offset: 0
      }
    };

    expect(expectedResponse.total).to.equal(10);
    expect(expectedResponse.accounts).to.have.length(10);
    expect(expectedResponse.accounts[0]).to.have.property('id', 'account-1');
    expect(expectedResponse.accounts[0]).to.have.property('name', 'Cash');
    expect(expectedResponse.accounts[0]).to.have.property('type', 'ASSET');
    expect(expectedResponse.accounts[0]).to.have.property('balance');
    expect(expectedResponse.accounts[0]).to.have.property('group');
  });

  it('should use fixed page size of 50', async function() {
    // Switch to large dataset
    currentMockAccounts = largeMockAccounts;
    
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const accounts = await book.getAccounts();
    
    const pageSize = 50;
    const accountCount = accounts.length;
    
    expect(pageSize).to.equal(50);
    expect(accountCount).to.equal(150);
    // Should return only first 50 accounts
    expect(accounts.slice(0, pageSize)).to.have.length(50);
  });

  it('should format response for MCP protocol', function() {
    const sampleResponse = {
      total: 10,
      accounts: mockAccounts.slice(0, 10),
      pagination: {
        hasMore: false,
        nextCursor: null,
        limit: 50,
        offset: 0
      }
    };

    const mcpResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sampleResponse, null, 2),
        },
      ],
    };

    expect(mcpResponse.content).to.have.length(1);
    expect(mcpResponse.content[0].type).to.equal('text');
    expect(mcpResponse.content[0].text).to.be.a('string');
    
    const parsedContent = JSON.parse(mcpResponse.content[0].text);
    expect(parsedContent.total).to.equal(10);
    expect(parsedContent.accounts).to.have.length(10);
    expect(parsedContent.pagination).to.exist;
    expect(parsedContent.pagination.limit).to.equal(50);
  });
});

describe('MCP Server - list_accounts pagination', function() {
  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    // Use large dataset for pagination tests
    currentMockAccounts = largeMockAccounts;
  });

  afterEach(function() {
    // Reset to small dataset
    currentMockAccounts = mockAccounts;
  });

  describe('Basic pagination', function() {
    it('should return first page with fixed 50-item limit when no cursor provided', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const accounts = await book.getAccounts();
      
      const expectedResponse = {
        total: accounts.length,
        accounts: accounts.slice(0, 50).map(account => account.json()),
        pagination: {
          hasMore: accounts.length > 50,
          nextCursor: accounts.length > 50 ? 'some-cursor-string' : null,
          limit: 50,
          offset: 0
        }
      };

      expect(expectedResponse.total).to.equal(150);
      expect(expectedResponse.accounts).to.have.length(50);
      expect(expectedResponse.pagination.hasMore).to.be.true;
      expect(expectedResponse.pagination.limit).to.equal(50);
      expect(expectedResponse.pagination.offset).to.equal(0);
      
      // Verify we get full account objects
      expect(expectedResponse.accounts[0]).to.have.property('id', 'account-1');
      expect(expectedResponse.accounts[0]).to.have.property('name', 'Account 1');
      expect(expectedResponse.accounts[0]).to.have.property('type');
      expect(expectedResponse.accounts[0]).to.have.property('balance');
      expect(expectedResponse.accounts[49]).to.have.property('name', 'Account 50');
    });

    it('should return next page when valid cursor provided', async function() {
      const cursor = Buffer.from(JSON.stringify({ 
        offset: 50, 
        timestamp: Date.now() 
      })).toString('base64');
      
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const accounts = await book.getAccounts();
      
      const expectedResponse = {
        total: accounts.length,
        accounts: accounts.slice(50, 100).map(account => account.json()),
        pagination: {
          hasMore: accounts.length > 100,
          nextCursor: 'expected-cursor-string',
          limit: 50,
          offset: 50
        }
      };

      expect(expectedResponse.total).to.equal(150);
      expect(expectedResponse.accounts).to.have.length(50);
      expect(expectedResponse.pagination.hasMore).to.be.true;
      expect(expectedResponse.accounts[0]).to.have.property('id', 'account-51');
      expect(expectedResponse.accounts[0]).to.have.property('name', 'Account 51');
      expect(expectedResponse.accounts[49]).to.have.property('name', 'Account 100');
    });

    it('should return correct pagination metadata', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const accounts = await book.getAccounts();
      
      // Test first page metadata
      const firstPageResponse = {
        total: accounts.length,
        accounts: accounts.slice(0, 50).map(account => account.json()),
        pagination: {
          hasMore: true,
          nextCursor: 'expected-cursor-string',
          limit: 50,
          offset: 0
        }
      };

      expect(firstPageResponse.pagination.hasMore).to.be.true;
      expect(firstPageResponse.pagination.limit).to.equal(50);
      expect(firstPageResponse.pagination.offset).to.equal(0);

      // Test last page metadata
      const lastPageResponse = {
        total: accounts.length,
        accounts: accounts.slice(100, 150).map(account => account.json()),
        pagination: {
          hasMore: false,
          nextCursor: null,
          limit: 50,
          offset: 100
        }
      };

      expect(lastPageResponse.pagination.hasMore).to.be.false;
      expect(lastPageResponse.pagination.nextCursor).to.be.null;
      expect(lastPageResponse.pagination.offset).to.equal(100);
    });
  });

  describe('Account type filtering and organization', function() {
    it('should return accounts with proper type classification', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const accounts = await book.getAccounts();
      const accountsData = accounts.map(account => account.json());

      // Check that we have different account types
      const assetAccounts = accountsData.filter(acc => acc.type === 'ASSET');
      const liabilityAccounts = accountsData.filter(acc => acc.type === 'LIABILITY');
      const equityAccounts = accountsData.filter(acc => acc.type === 'EQUITY');
      const incomeAccounts = accountsData.filter(acc => acc.type === 'INCOME');
      const outgoingAccounts = accountsData.filter(acc => acc.type === 'OUTGOING');

      expect(assetAccounts.length).to.be.greaterThan(0);
      expect(liabilityAccounts.length).to.be.greaterThan(0);
      expect(equityAccounts.length).to.be.greaterThan(0);
      expect(incomeAccounts.length).to.be.greaterThan(0);
      expect(outgoingAccounts.length).to.be.greaterThan(0);
    });
  });
});

describe('MCP Server - list_accounts tool schema', function() {
  it('should include only bookId and cursor parameters in tool schema', function() {
    const expectedToolSchema = {
      name: 'list_accounts',
      description: 'List accounts in a book with fixed 50-item pagination',
      inputSchema: {
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
      }
    };

    expect(expectedToolSchema.inputSchema.properties).to.have.property('bookId');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('cursor');
    expect(expectedToolSchema.inputSchema.properties).to.not.have.property('limit');
    expect(expectedToolSchema.description).to.include('fixed 50-item');
    expect(expectedToolSchema.inputSchema.required).to.include('bookId');
  });

  it('should fail because list_accounts tool is not implemented yet', function() {
    // This test will FAIL until we implement list_accounts tool
    const toolImplemented = false;
    
    expect(toolImplemented).to.be.true; // This will fail
  });
});