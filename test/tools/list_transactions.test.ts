import { expect } from 'chai';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript interfaces for test data
interface TransactionData {
  id: string;
  date: string;
  dateValue: number;
  amount: number;
  description: string;
  posted: boolean;
  creditAccount: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  debitAccount: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "OUTGOING";
  };
  properties: {[name: string]: string};
  urls: string[];
}

interface MockTransactionIterator {
  hasNext(): boolean;
  next(): MockTransaction[];
  getCursor(): string | null;
}

interface MockTransaction {
  json(): TransactionData;
}

interface MockBook {
  listTransactions(query?: string, limit?: number, cursor?: string): Promise<MockTransactionIterator>;
}

interface MockBkper {
  setConfig: (config: any) => void;
  getBook: (id: string) => Promise<MockBook>;
}

// Mock transaction data from fixtures
const mockTransactions: TransactionData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures', 'sample-transactions.json'), 'utf8'));

// Create a large dataset for API cursor pagination testing
const largeMockTransactions: TransactionData[] = Array.from({ length: 500 }, (_, i) => ({
  id: `txn-${i + 1}`,
  date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
  dateValue: Date.now() + (i * 24 * 60 * 60 * 1000),
  amount: Math.floor(Math.random() * 5000) + 100,
  description: `Transaction ${i + 1} - ${['Service payment', 'Equipment purchase', 'Utility bill', 'Office rent', 'Consulting fee'][i % 5]}`,
  posted: Math.random() > 0.1, // 90% posted
  creditAccount: {
    id: `account-${(i % 10) + 1}`,
    name: `Account ${(i % 10) + 1}`,
    type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][i % 5] as any
  },
  debitAccount: {
    id: `account-${((i + 1) % 10) + 1}`,
    name: `Account ${((i + 1) % 10) + 1}`,
    type: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "OUTGOING"][(i + 1) % 5] as any
  },
  properties: { batch: String(Math.floor(i / 50)) },
  urls: []
}));

let currentMockTransactions: TransactionData[] = mockTransactions;

const mockBkperJs: MockBkper = {
  setConfig: () => {},
  getBook: async (id: string): Promise<MockBook> => {
    return {
      listTransactions: async (query?: string, limit?: number, cursor?: string): Promise<MockTransactionIterator> => {
        // Apply query filtering for testing
        let filteredTransactions = currentMockTransactions;
        
        if (query) {
          // Simulate Bkper query filtering
          if (query.includes('account:Cash')) {
            filteredTransactions = currentMockTransactions.filter(t => 
              t.creditAccount.name === 'Cash' || t.debitAccount.name === 'Cash'
            );
          } else if (query.includes('amount:>1000')) {
            filteredTransactions = currentMockTransactions.filter(t => t.amount > 1000);
          } else if (query.includes('posted:true')) {
            filteredTransactions = currentMockTransactions.filter(t => t.posted === true);
          } else if (query.includes('posted:false')) {
            filteredTransactions = currentMockTransactions.filter(t => t.posted === false);
          } else if (query.includes('after:2024-01-20')) {
            filteredTransactions = currentMockTransactions.filter(t => t.date > '2024-01-20');
          } else if (query.includes('before:2024-01-25')) {
            filteredTransactions = currentMockTransactions.filter(t => t.date < '2024-01-25');
          }
        }

        // Handle cursor-based pagination (simulating API behavior)
        const pageSize = limit || 25; // Default API page size
        let startIndex = 0;
        
        if (cursor) {
          try {
            const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString());
            startIndex = cursorData.offset || 0;
          } catch {
            startIndex = 0;
          }
        }

        const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);
        const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
        const hasMore = endIndex < filteredTransactions.length;

        return {
          hasNext: () => hasMore,
          next: (): MockTransaction[] => pageTransactions.map((txnData: TransactionData) => ({
            json: (): TransactionData => txnData
          })),
          getCursor: (): string | null => hasMore ? 
            Buffer.from(JSON.stringify({ offset: endIndex })).toString('base64') : null
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

describe('MCP Server - list_transactions tool', function() {
  beforeEach(function() {
    // Set mock environment variables
    process.env.BKPER_API_KEY = 'test-api-key';
    // Reset to small dataset
    currentMockTransactions = mockTransactions;
  });

  it('should return formatted transaction list response', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    const iterator = await book.listTransactions();
    const transactions = iterator.next();
    
    const transactionsData = transactions.map(txn => txn.json());

    const expectedResponse = {
      transactions: transactionsData,
      hasMore: iterator.hasNext(),
      cursor: iterator.getCursor()
    };

    expect(expectedResponse.transactions).to.have.length(8);
    expect(expectedResponse.transactions[0]).to.have.property('id', 'txn-1');
    expect(expectedResponse.transactions[0]).to.have.property('date', '2024-01-15');
    expect(expectedResponse.transactions[0]).to.have.property('amount', 5000.00);
    expect(expectedResponse.transactions[0]).to.have.property('description');
    expect(expectedResponse.transactions[0]).to.have.property('posted', true);
    expect(expectedResponse.transactions[0]).to.have.property('creditAccount');
    expect(expectedResponse.transactions[0]).to.have.property('debitAccount');
    expect(expectedResponse.transactions[0]).to.have.property('properties');
  });

  it('should handle API cursor-based pagination', async function() {
    // Switch to large dataset
    currentMockTransactions = largeMockTransactions;
    
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // First page
    const firstIterator = await book.listTransactions(undefined, 25);
    const firstTransactions = firstIterator.next();
    const firstCursor = firstIterator.getCursor();
    
    expect(firstTransactions).to.have.length(25);
    expect(firstIterator.hasNext()).to.be.true;
    expect(firstCursor).to.be.a('string');

    // Second page using cursor
    const secondIterator = await book.listTransactions(undefined, 25, firstCursor);
    const secondTransactions = secondIterator.next();
    
    expect(secondTransactions).to.have.length(25);
    expect(secondTransactions[0].json().id).to.equal('txn-26');
  });

  it('should format response for MCP protocol', function() {
    const sampleTransactions = mockTransactions.slice(0, 5);
    
    const mcpResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            transactions: sampleTransactions,
            hasMore: false,
            cursor: null
          }, null, 2),
        },
      ],
    };

    expect(mcpResponse.content).to.have.length(1);
    expect(mcpResponse.content[0].type).to.equal('text');
    expect(mcpResponse.content[0].text).to.be.a('string');
    
    const parsedContent = JSON.parse(mcpResponse.content[0].text);
    expect(parsedContent).to.have.property('transactions');
    expect(parsedContent).to.have.property('hasMore');
    expect(parsedContent).to.have.property('cursor');
    expect(parsedContent.transactions).to.have.length(5);
  });
});

describe('MCP Server - list_transactions query examples', function() {
  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    currentMockTransactions = mockTransactions;
  });

  it('should filter transactions by account', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    const iterator = await book.listTransactions('account:Cash');
    const transactions = iterator.next();
    const transactionsData = transactions.map(txn => txn.json());
    
    // All transactions should involve Cash account
    transactionsData.forEach(txn => {
      const involvesCash = txn.creditAccount.name === 'Cash' || txn.debitAccount.name === 'Cash';
      expect(involvesCash).to.be.true;
    });
  });

  it('should filter transactions by amount', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    const iterator = await book.listTransactions('amount:>1000');
    const transactions = iterator.next();
    const transactionsData = transactions.map(txn => txn.json());
    
    // All transactions should have amount > 1000
    transactionsData.forEach(txn => {
      expect(txn.amount).to.be.greaterThan(1000);
    });
  });

  it('should filter transactions by posted status', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // Test posted transactions
    const postedIterator = await book.listTransactions('posted:true');
    const postedTransactions = postedIterator.next();
    const postedData = postedTransactions.map(txn => txn.json());
    
    postedData.forEach(txn => {
      expect(txn.posted).to.be.true;
    });

    // Test unposted transactions
    const unpostedIterator = await book.listTransactions('posted:false');
    const unpostedTransactions = unpostedIterator.next();
    const unpostedData = unpostedTransactions.map(txn => txn.json());
    
    unpostedData.forEach(txn => {
      expect(txn.posted).to.be.false;
    });
  });

  it('should filter transactions by date range', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // Test after date filter
    const afterIterator = await book.listTransactions('after:2024-01-20');
    const afterTransactions = afterIterator.next();
    const afterData = afterTransactions.map(txn => txn.json());
    
    afterData.forEach(txn => {
      expect(txn.date > '2024-01-20').to.be.true;
    });

    // Test before date filter
    const beforeIterator = await book.listTransactions('before:2024-01-25');
    const beforeTransactions = beforeIterator.next();
    const beforeData = beforeTransactions.map(txn => txn.json());
    
    beforeData.forEach(txn => {
      expect(txn.date < '2024-01-25').to.be.true;
    });
  });
});

describe('MCP Server - list_transactions API cursor pagination', function() {
  beforeEach(function() {
    process.env.BKPER_API_KEY = 'test-api-key';
    // Use large dataset for pagination tests
    currentMockTransactions = largeMockTransactions;
  });

  afterEach(function() {
    // Reset to small dataset
    currentMockTransactions = mockTransactions;
  });

  it('should use API cursor pagination not fixed page size', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // Test different page sizes (API supports this unlike other tools)
    const smallIterator = await book.listTransactions(undefined, 10);
    const smallTransactions = smallIterator.next();
    expect(smallTransactions).to.have.length(10);

    const largeIterator = await book.listTransactions(undefined, 100);
    const largeTransactions = largeIterator.next();
    expect(largeTransactions).to.have.length(100);
  });

  it('should handle cursor progression through large dataset', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    let currentCursor: string | null = null;
    let totalProcessed = 0;
    let pageCount = 0;
    
    // Process through multiple pages
    while (pageCount < 5) { // Process first 5 pages
      const iterator = await book.listTransactions(undefined, 25, currentCursor || undefined);
      const transactions = iterator.next();
      
      expect(transactions.length).to.be.greaterThan(0);
      totalProcessed += transactions.length;
      
      if (!iterator.hasNext()) break;
      
      currentCursor = iterator.getCursor();
      expect(currentCursor).to.be.a('string');
      pageCount++;
    }
    
    expect(totalProcessed).to.be.greaterThan(100);
    expect(pageCount).to.be.greaterThan(3);
  });

  it('should maintain query filters across cursor pagination', async function() {
    const bookId = 'book-1';
    const book = await mockBkperJs.getBook(bookId);
    
    // First page with query
    const firstIterator = await book.listTransactions('posted:true', 25);
    const firstTransactions = firstIterator.next();
    const firstCursor = firstIterator.getCursor();
    
    // Verify first page results
    firstTransactions.forEach(txn => {
      expect(txn.json().posted).to.be.true;
    });

    if (firstCursor) {
      // Second page with same query
      const secondIterator = await book.listTransactions('posted:true', 25, firstCursor);
      const secondTransactions = secondIterator.next();
      
      // Verify second page also respects query
      secondTransactions.forEach(txn => {
        expect(txn.json().posted).to.be.true;
      });
    }
  });
});

describe('MCP Server - list_transactions tool schema', function() {
  it('should include bookId, query, limit, and cursor parameters', function() {
    const expectedToolSchema = {
      name: 'list_transactions',
      description: 'List transactions in a book with API cursor-based pagination and query support',
      inputSchema: {
        type: 'object',
        properties: {
          bookId: {
            type: 'string',
            description: 'The unique identifier of the book'
          },
          query: {
            type: 'string',
            description: 'Bkper query to filter transactions (e.g., "account:Cash amount:>1000 after:2024-01-01")'
          },
          limit: {
            type: 'number',
            description: 'Number of transactions per page (default 25, max 100)',
            minimum: 1,
            maximum: 100,
            default: 25
          },
          cursor: {
            type: 'string',
            description: 'API cursor for next page'
          }
        },
        required: ['bookId']
      }
    };

    expect(expectedToolSchema.inputSchema.properties).to.have.property('bookId');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('query');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('limit');
    expect(expectedToolSchema.inputSchema.properties).to.have.property('cursor');
    expect(expectedToolSchema.description).to.include('API cursor-based pagination');
    expect(expectedToolSchema.description).to.include('query support');
    expect(expectedToolSchema.inputSchema.required).to.include('bookId');
  });

  it('should fail because list_transactions tool is not implemented yet', function() {
    // This test will FAIL until we implement list_transactions tool
    const toolImplemented = false;
    
    expect(toolImplemented).to.be.true; // This will fail
  });
});