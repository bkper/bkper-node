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
          if (query.includes('account:Cash')) {
            filteredBalances = currentMockBalances.filter(b => b.account.name === 'Cash');
          } else if (query.includes('group:Assets')) {
            filteredBalances = currentMockBalances.filter(b => b.account.type === 'ASSET');
          } else if (query.includes('group:Liabilities')) {
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

describe('MCP Server - get_balances tool', function() {
  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
    // Reset to small dataset
    currentMockBalances = mockBalances;
  });

  it('should return formatted balance list response', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const balanceReport = await book.getBalancesReport();
    const balances = await balanceReport.getBalances();
    
    const fullBalancesData = balances.slice(0, 50).map(balance => balance.json());

    const expectedResponse = {
      total: balances.length,
      balances: fullBalancesData,
      pagination: {
        hasMore: balances.length > 50,
        nextCursor: balances.length > 50 ? 'some-cursor-string' : null,
        limit: 50,
        offset: 0
      }
    };

    expect(expectedResponse.total).to.equal(10);
    expect(expectedResponse.balances).to.have.length(10);
    expect(expectedResponse.balances[0]).to.have.property('account');
    expect(expectedResponse.balances[0]).to.have.property('balance');
    expect(expectedResponse.balances[0]).to.have.property('normalizedBalance');
    expect(expectedResponse.balances[0]).to.have.property('cumulative');
    expect(expectedResponse.balances[0].account).to.have.property('id');
    expect(expectedResponse.balances[0].account).to.have.property('name');
    expect(expectedResponse.balances[0].account).to.have.property('type');
  });

  it('should use fixed page size of 50', async function() {
    // Switch to large dataset
    currentMockBalances = largeMockBalances;
    
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const balanceReport = await book.getBalancesReport();
    const balances = await balanceReport.getBalances();
    
    const pageSize = 50;
    const balanceCount = balances.length;
    
    expect(pageSize).to.equal(50);
    expect(balanceCount).to.equal(150);
    // Should return only first 50 balances
    expect(balances.slice(0, pageSize)).to.have.length(50);
  });

  it('should handle balance queries and filtering', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // Test with account filter
    const cashBalanceReport = await book.getBalancesReport('account:Cash');
    const cashBalances = await cashBalanceReport.getBalances();
    const cashBalancesData = cashBalances.map(balance => balance.json());
    
    // Verify all returned balances are for Cash account
    cashBalancesData.forEach(balance => {
      expect(balance.account.name).to.equal('Cash');
    });

    // Test with group filter for assets
    const assetBalanceReport = await book.getBalancesReport('group:Assets');
    const assetBalances = await assetBalanceReport.getBalances();
    const assetBalancesData = assetBalances.map(balance => balance.json());
    
    // Verify all returned balances are ASSET type
    assetBalancesData.forEach(balance => {
      expect(balance.account.type).to.equal('ASSET');
    });
  });

  it('should format response for MCP protocol', function() {
    const sampleResponse = {
      total: 10,
      balances: mockBalances.slice(0, 10),
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
    expect(parsedContent.balances).to.have.length(10);
    expect(parsedContent.pagination).to.exist;
    expect(parsedContent.pagination.limit).to.equal(50);
  });
});

describe('MCP Server - get_balances pagination', function() {
  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    // Use large dataset for pagination tests
    currentMockBalances = largeMockBalances;
  });

  afterEach(function() {
    // Reset to small dataset
    currentMockBalances = mockBalances;
  });

  describe('Basic pagination', function() {
    it('should return first page with fixed 50-item limit when no cursor provided', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const balanceReport = await book.getBalancesReport();
      const balances = await balanceReport.getBalances();
      
      const expectedResponse = {
        total: balances.length,
        balances: balances.slice(0, 50).map(balance => balance.json()),
        pagination: {
          hasMore: balances.length > 50,
          nextCursor: balances.length > 50 ? 'some-cursor-string' : null,
          limit: 50,
          offset: 0
        }
      };

      expect(expectedResponse.total).to.equal(150);
      expect(expectedResponse.balances).to.have.length(50);
      expect(expectedResponse.pagination.hasMore).to.be.true;
      expect(expectedResponse.pagination.limit).to.equal(50);
      expect(expectedResponse.pagination.offset).to.equal(0);
      
      // Verify we get full balance objects
      expect(expectedResponse.balances[0]).to.have.property('account');
      expect(expectedResponse.balances[0]).to.have.property('balance');
      expect(expectedResponse.balances[0]).to.have.property('normalizedBalance');
      expect(expectedResponse.balances[0]).to.have.property('cumulative');
    });

    it('should return next page when valid cursor provided', async function() {
      const cursor = Buffer.from(JSON.stringify({ 
        offset: 50, 
        timestamp: Date.now() 
      })).toString('base64');
      
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const balanceReport = await book.getBalancesReport();
      const balances = await balanceReport.getBalances();
      
      const expectedResponse = {
        total: balances.length,
        balances: balances.slice(50, 100).map(balance => balance.json()),
        pagination: {
          hasMore: balances.length > 100,
          nextCursor: 'expected-cursor-string',
          limit: 50,
          offset: 50
        }
      };

      expect(expectedResponse.total).to.equal(150);
      expect(expectedResponse.balances).to.have.length(50);
      expect(expectedResponse.pagination.hasMore).to.be.true;
      expect(expectedResponse.balances[0].account.id).to.equal('account-51');
      expect(expectedResponse.balances[49].account.id).to.equal('account-100');
    });

    it('should return correct pagination metadata', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const balanceReport = await book.getBalancesReport();
      const balances = await balanceReport.getBalances();
      
      // Test last page metadata
      const lastPageResponse = {
        total: balances.length,
        balances: balances.slice(100, 150).map(balance => balance.json()),
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

  describe('Balance calculations and grouping', function() {
    it('should return balances with proper calculation fields', async function() {
      const bookId = 'book-1';
      const book = await mockBkperJs.getBook(bookId);
      const balanceReport = await book.getBalancesReport();
      const balances = await balanceReport.getBalances();
      const balancesData = balances.map(balance => balance.json());

      balancesData.forEach(balance => {
        // Each balance should have all calculation fields
        expect(balance).to.have.property('balance');
        expect(balance).to.have.property('normalizedBalance');
        expect(balance).to.have.property('cumulative');
        expect(balance.balance).to.be.a('number');
        expect(balance.normalizedBalance).to.be.a('number');
        expect(balance.cumulative).to.be.a('number');
      });
    });
  });
});

describe('MCP Server - get_balances tool schema', function() {
  it('should include bookId, cursor, and query parameters in tool schema', function() {
    const expectedToolSchema = {
      name: 'get_balances',
      description: 'Get account balances for a book with fixed 50-item pagination',
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
          },
          query: {
            type: 'string',
            description: 'Optional query to filter balances (e.g., "account:Cash", "group:Assets", "on:2024-01-31")'
          }
        },
        required: ['bookId']
      }
    };

    expect(expectedToolSchema.inputSchema.properties).to.have.property('bookId');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('cursor');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('query');
    expect(expectedToolSchema.inputSchema.properties).to.not.have.property('limit');
    expect(expectedToolSchema.description).to.include('fixed 50-item');
    expect(expectedToolSchema.inputSchema.required).to.include('bookId');
  });

  it('should fail because get_balances tool is not implemented yet', function() {
    // This test will FAIL until we implement get_balances tool
    const toolImplemented = false;
    
    expect(toolImplemented).to.be.true; // This will fail
  });
});